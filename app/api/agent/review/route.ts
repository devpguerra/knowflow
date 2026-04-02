import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTools, type ClaudeMessage, type ContentBlock } from "@/lib/claude";
import { executeToolCalls, toToolResultBlocks } from "@/lib/toolExecutor";
import { agentTools, type ToolUseBlock } from "@/lib/tools";
import type {
  Flashcard,
  QuizQuestion,
  StudyGuideSection,
  ReviewPack,
  AgentReasoning,
  KnowledgeGapAssessment,
  QuizResult,
} from "@/types";

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
    }: {
      sourceText: string;
      quizResult: QuizResult;
      questions: QuizQuestion[];
    } = body;

    if (!quizResult) {
      return NextResponse.json({ error: "quizResult is required." }, { status: 400 });
    }

    const pct = Math.round((quizResult.score / quizResult.totalQuestions) * 100);

    // Map numeric answer indices to readable text for the agent
    const wrongAnswerLines = quizResult.wrongAnswers
      .map((wa) => {
        const q = questions.find((q) => q.id === wa.questionId);
        const userText = q?.options[wa.userAnswer] ?? `Option ${wa.userAnswer + 1}`;
        const correctText = q?.options[wa.correctAnswer] ?? `Option ${wa.correctAnswer + 1}`;
        return `- Concept: ${wa.concept}\n  Q: ${wa.question}\n  Student answered: "${userText}"\n  Correct: "${correctText}"`;
      })
      .join("\n");

    const sourceExcerpt = sourceText ? sourceText.slice(0, 500) : "(no source text provided)";

    // ── Agent loop ──────────────────────────────────────────────────────────

    const messages: ClaudeMessage[] = [
      {
        role: "user",
        content: `A student just completed a quiz. Here are the results:

Score: ${quizResult.score}/${quizResult.totalQuestions} (${pct}%)

${quizResult.wrongAnswers.length === 0 ? "Perfect score — no wrong answers." : `Wrong answers:\n${wrongAnswerLines}`}

Source material excerpt:
"""
${sourceExcerpt}${sourceText.length > 500 ? "…" : ""}
"""

Please assess their knowledge gaps and generate appropriate review materials.`,
      },
    ];

    const reasoningTexts: string[] = [];
    const toolTimings: { toolName: string; durationMs: number }[] = [];
    const toolResultsByName: Record<string, unknown> = {};

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await callClaudeWithTools(SYSTEM_PROMPT, messages, agentTools);

      // Capture text as reasoning
      const textBlocks = (response.content as ContentBlock[]).filter((b) => b.type === "text");
      for (const b of textBlocks) {
        if (b.text) reasoningTexts.push(b.text as string);
      }

      // Find tool calls
      const toolUseBlocks = (response.content as unknown[]).filter(
        (b): b is ToolUseBlock => (b as ToolUseBlock).type === "tool_use"
      );

      if (toolUseBlocks.length === 0) break;

      const results = await executeToolCalls(toolUseBlocks);

      for (const r of results) {
        toolTimings.push({ toolName: r.toolName, durationMs: r.durationMs });
        toolResultsByName[r.toolName] = r.result;
      }

      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toToolResultBlocks(results) });

      if (response.stop_reason !== "tool_use") break;
    }

    // ── Assemble ReviewPack ─────────────────────────────────────────────────

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
      agentReasoning: buildReasoning(reasoningTexts, Object.keys(toolResultsByName)),
    };

    return NextResponse.json(reviewPack);
  } catch (err) {
    console.error("[/api/agent/review]", err);
    return NextResponse.json(
      { error: "Review agent failed. Please try again." },
      { status: 500 }
    );
  }
}

function buildReasoning(texts: string[], toolsCalled: string[]): AgentReasoning {
  const rationale = texts.join("\n\n").trim();
  return {
    thought: texts[0]?.trim() ?? "",
    decision: toolsCalled.length
      ? `Called tools: ${toolsCalled.join(", ")}`
      : "No tools called",
    toolsCalled,
    rationale,
  };
}
