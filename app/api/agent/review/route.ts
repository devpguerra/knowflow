import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTools, type ClaudeMessage, type ContentBlock } from "@/lib/claude";
import { executeToolCalls, toToolResultBlocks } from "@/lib/toolExecutor";
import { agentTools, PARALLEL_SAFE, type ToolUseBlock } from "@/lib/tools";
import type {
  Flashcard,
  QuizQuestion,
  StudyGuideSection,
  ReviewPack,
  KnowledgeGapAssessment,
  QuizResult,
  AgentEvent,
} from "@/types";

export const maxDuration = 300;

const MAX_TURNS = 10;

const SYSTEM_PROMPT = `You are Knowledge Transformer's review agent. You have been given quiz results showing where a user struggled.

Your job is to:
1. Call assess_knowledge_gaps to diagnose the problem
2. Based on the severity and nature of the gaps, DECIDE the review strategy:
   - Score > 80%: Light review — only focused flashcards for missed concepts
   - Score 50-80%: Moderate review — flashcards + simplified study section + retake quiz
   - Score < 50%: Deep review — simplified study guide covering fundamentals + easier quiz
3. Explain your reasoning and encourage the user

Think step by step. The user should feel guided, not judged.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sourceText,
      quizResult,
      questions,
      useMock = false,
    }: {
      sourceText: string;
      quizResult: QuizResult;
      questions: QuizQuestion[];
      useMock?: boolean;
    } = body;

    if (!quizResult) {
      return NextResponse.json({ error: "quizResult is required." }, { status: 400 });
    }

    const pct = Math.round((quizResult.score / quizResult.totalQuestions) * 100);

    const wrongAnswerLines = quizResult.wrongAnswers
      .map((wa) => {
        const q = questions.find((q) => q.id === wa.questionId);
        const userText = q?.options[wa.userAnswer] ?? `Option ${wa.userAnswer + 1}`;
        const correctText = q?.options[wa.correctAnswer] ?? `Option ${wa.correctAnswer + 1}`;
        return `- Concept: ${wa.concept}\n  Q: ${wa.question}\n  Student answered: "${userText}"\n  Correct: "${correctText}"`;
      })
      .join("\n");

    const sourceExcerpt = sourceText ? sourceText.slice(0, 500) : "(no source text provided)";

    const initialMessage: ClaudeMessage = {
      role: "user",
      content: `A student just completed a quiz. Here are the results:

Score: ${quizResult.score}/${quizResult.totalQuestions} (${pct}%)

${quizResult.wrongAnswers.length === 0 ? "Perfect score — no wrong answers." : `Wrong answers:\n${wrongAnswerLines}`}

Source material excerpt:
"""
${sourceExcerpt}${sourceText.length > 500 ? "…" : ""}
"""

Please assess their knowledge gaps and generate appropriate review materials.`,
    };

    // ── SSE setup ───────────────────────────────────────────────────────────
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();
    const enc = new TextEncoder();
    const send = (obj: object) => writer.write(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

    const response = new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

    // ── Agent loop (background) ─────────────────────────────────────────────
    (async () => {
      try {
        const messages: ClaudeMessage[] = [initialMessage];
        const agentEvents: AgentEvent[] = [];
        const toolResultsByName: Record<string, unknown> = {};
        const parallelSafeSet = new Set<string>(PARALLEL_SAFE);

        for (let turn = 0; turn < MAX_TURNS; turn++) {
          const response = await callClaudeWithTools(SYSTEM_PROMPT, messages, agentTools, useMock);

          const textBlocks = (response.content as ContentBlock[]).filter((b) => b.type === "text");
          for (const b of textBlocks) {
            if (b.text) {
              const event: AgentEvent = { type: "reasoning", text: b.text as string };
              agentEvents.push(event);
              send({ type: "event", payload: event });
            }
          }

          const toolUseBlocks = (response.content as unknown[]).filter(
            (b): b is ToolUseBlock => (b as ToolUseBlock).type === "tool_use"
          );

          if (toolUseBlocks.length === 0) break;

          const results = await executeToolCalls(toolUseBlocks, useMock);

          const seqResults = results.filter((r) => !parallelSafeSet.has(r.toolName));
          const parResults = results.filter((r) => parallelSafeSet.has(r.toolName));

          for (const r of results) {
            toolResultsByName[r.toolName] = r.result;
          }

          for (const r of seqResults) {
            const event: AgentEvent = { type: "tool_call", tools: [{ toolName: r.toolName, durationMs: r.durationMs }], parallel: false };
            agentEvents.push(event);
            send({ type: "event", payload: event });
          }

          if (parResults.length > 0) {
            const event: AgentEvent = {
              type: "tool_call",
              tools: parResults.map((r) => ({ toolName: r.toolName, durationMs: r.durationMs })),
              parallel: parResults.length > 1,
            };
            agentEvents.push(event);
            send({ type: "event", payload: event });
          }

          messages.push({ role: "assistant", content: response.content });
          messages.push({ role: "user", content: toToolResultBlocks(results) });

          if (response.stop_reason !== "tool_use") break;
        }

        const assessment: KnowledgeGapAssessment = toolResultsByName["assess_knowledge_gaps"]
          ? (toolResultsByName["assess_knowledge_gaps"] as KnowledgeGapAssessment)
          : {
              weakConcepts: quizResult.missedConcepts.map((name) => ({ name, severity: "medium" as const })),
              strategy: "Review the concepts you missed and retake the quiz.",
              recommendedActions: ["Review missed concepts", "Retake the quiz"],
            };

        const reviewPack: ReviewPack = {
          assessment,
          focusedFlashcards: (toolResultsByName["generate_flashcards"] as Flashcard[] | undefined) ?? null,
          retakeQuiz: toolResultsByName["generate_quiz"]
            ? { questions: toolResultsByName["generate_quiz"] as QuizQuestion[] }
            : null,
          simplifiedGuide: toolResultsByName["generate_study_guide"]
            ? { sections: toolResultsByName["generate_study_guide"] as StudyGuideSection[] }
            : null,
        };

        send({ type: "done", payload: { reviewPack, agentEvents } });
      } catch (err) {
        console.error("[/api/agent/review]", err);
        send({ type: "error", payload: { message: "Review agent failed. Please try again." } });
      } finally {
        await writer.close();
      }
    })();

    return response;
  } catch (err) {
    console.error("[/api/agent/review] setup error", err);
    return NextResponse.json(
      { error: "Review agent failed. Please try again." },
      { status: 500 }
    );
  }
}
