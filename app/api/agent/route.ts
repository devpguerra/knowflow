import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTools, type ClaudeMessage, type ContentBlock } from "@/lib/claude";
import { executeToolCalls, toToolResultBlocks } from "@/lib/toolExecutor";
import { agentTools, PARALLEL_SAFE, type ToolUseBlock } from "@/lib/tools";
import { extractTextFromPDF } from "@/lib/pdf";
import { preprocessDocument, validateContent, validateTopicFast, validateTopicWithModel } from "@/lib/preprocess";
import type {
  Analysis,
  Flashcard,
  QuizQuestion,
  StudyGuideSection,
  GeneratedMaterials,
  AgentEvent,
} from "@/types";

export const maxDuration = 300;

// ── SSE helpers ─────────────────────────────────────────────────────────────

function makeSseStream() {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const send = (obj: object) => writer.write(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
  const close = () => writer.close();
  const response = new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
  return { send, close, response };
}

// ── Agent loop helpers ───────────────────────────────────────────────────────

const MAX_CHARS = 150_000;
const SUMMARIZE_THRESHOLD = 20_000;
const MAX_TURNS = 10;

const TOPIC_SYSTEM_PROMPT = `You are Knowledge Transformer, an intelligent study agent. The user has provided a topic — there is NO source document. Build all study materials from web research.

Your mandatory workflow:
1. IMMEDIATELY call web_search with a well-formed educational query for the topic.
2. Call web_search again if needed to cover sub-topics (context, key figures, applications, etc.).
3. Call analyze_content — pass the aggregated web_search summaries as the "text" parameter.
4. Generate all three material types: flashcards, quiz, AND study guide. Use "comprehensive" depth for the study guide.

Think step by step. After each web_search state what you found. After analyze_content confirm your plan.

IMPORTANT: When calling multiple generation tools (flashcards, quiz, study_guide), call them all in a single response — the backend executes them in parallel.`;

const SYSTEM_PROMPT = `You are Knowledge Transformer, an intelligent study agent. You have tools available to analyze content and generate study materials.

Your job is to:
1. First, ALWAYS call analyze_content to understand the source material. If the text begins with "[Document sections: ...]", those are the document's own section headings — use them as focus_areas when calling generate_study_guide.
2. Based on your analysis, DECIDE which materials to generate and why:
   - Heavy on terminology? Prioritize flashcards
   - Process-heavy or conceptual? Prioritize study guide
   - Always generate a quiz for assessment
   - If the source references concepts it doesn't explain well, use web_search first
3. Call the generation tools with appropriate parameters
4. Explain your reasoning to the user

Think step by step. After analyze_content, explain what you found and what you plan to generate before calling the generation tools.

IMPORTANT: When calling multiple generation tools (flashcards, quiz, study_guide), you may call them all in a single response. The backend will execute them in parallel.`;

async function runAgentLoop(
  systemPrompt: string,
  messages: ClaudeMessage[],
  send: (obj: object) => void,
  useMock = false
): Promise<{ analysis: Analysis | null; materials: GeneratedMaterials; agentEvents: AgentEvent[] }> {
  const agentEvents: AgentEvent[] = [];
  const toolResultsByName: Record<string, unknown> = {};
  let analysis: Analysis | null = null;
  const parallelSafeSet = new Set<string>(PARALLEL_SAFE);

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await callClaudeWithTools(systemPrompt, messages, agentTools, useMock);

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
      if (r.toolName === "analyze_content") analysis = r.result as Analysis;
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

  const materials: GeneratedMaterials = {
    flashcards: (toolResultsByName["generate_flashcards"] as Flashcard[] | undefined) ?? null,
    quiz: toolResultsByName["generate_quiz"]
      ? { questions: toolResultsByName["generate_quiz"] as QuizQuestion[] }
      : null,
    studyGuide: toolResultsByName["generate_study_guide"]
      ? { sections: toolResultsByName["generate_study_guide"] as StudyGuideSection[] }
      : null,
  };

  return { analysis, materials, agentEvents };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let text: string;
    let difficulty: string;
    let isTopic = false;
    let topicValue = "";
    let useMock = false;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      difficulty = (form.get("difficulty") as string | null) ?? "intermediate";
      const file = form.get("file") as File | null;
      const pastedText = form.get("text") as string | null;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        text = await extractTextFromPDF(buffer);
        console.log(`[PDF] Extracted ${text.length} characters from ${file.name}`);
      } else if (pastedText) {
        text = pastedText;
      } else {
        return NextResponse.json({ error: "Provide either a PDF file or text." }, { status: 400 });
      }
    } else {
      const body = await req.json();
      const topic: string | undefined = body.topic;
      text = body.text;
      difficulty = body.difficulty ?? "intermediate";
      useMock = body.useMock === true;

      if (topic !== undefined) {
        const fast = validateTopicFast(topic);
        if (!fast.valid) return NextResponse.json({ error: fast.reason }, { status: 400 });

        const model = await validateTopicWithModel(topic, useMock);
        if (!model.valid) return NextResponse.json({ error: model.reason }, { status: 400 });

        isTopic = true;
        topicValue = topic;
      } else if (!text) {
        return NextResponse.json({ error: "text is required." }, { status: 400 });
      }
    }

    // ── SSE setup ───────────────────────────────────────────────────────────
    const { send, close, response } = makeSseStream();

    // ── Agent loop (background) ─────────────────────────────────────────────
    (async () => {
      try {
        let messages: ClaudeMessage[];
        let systemPrompt: string;

        if (isTopic) {
          messages = [
            {
              role: "user",
              content: `Please generate comprehensive study materials for the topic: "${topicValue}"\n\nTarget difficulty: ${difficulty}\n\nRemember: you have no source document — use web_search first to gather educational context before generating anything.`,
            },
          ];
          systemPrompt = TOPIC_SYSTEM_PROMPT;
        } else {
          if (text.length > MAX_CHARS) {
            console.warn(`[agent] Document truncated from ${text.length} to ${MAX_CHARS} chars (hard limit)`);
            text = text.slice(0, MAX_CHARS);
          }

          if (text.length > SUMMARIZE_THRESHOLD) {
            const { condensedText } = preprocessDocument(text, 15_000);
            console.log(`[preprocess] Reduced ${text.length} → ${condensedText.length} chars`);
            text = condensedText;
          }

          const validation = await validateContent(text, useMock);
          if (!validation.valid) {
            send({ type: "error", payload: { message: validation.reason } });
            return;
          }

          messages = [
            {
              role: "user",
              content: `Please analyze and generate study materials for the following content at ${difficulty} difficulty level:\n\n${text}`,
            },
          ];
          systemPrompt = SYSTEM_PROMPT;
        }

        const { analysis, materials, agentEvents } = await runAgentLoop(systemPrompt, messages, send, useMock);
        send({ type: "done", payload: { analysis, materials, agentEvents } });
      } catch (err) {
        console.error("[/api/agent]", err);
        send({ type: "error", payload: { message: "Agent failed to generate study materials. Please try again." } });
      } finally {
        await close();
      }
    })();

    return response;
  } catch (err) {
    console.error("[/api/agent] setup error", err);
    return NextResponse.json(
      { error: "Agent failed to generate study materials. Please try again." },
      { status: 500 }
    );
  }
}
