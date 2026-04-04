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

export const maxDuration = 60;

async function runTopicAgent(topic: string, difficulty: string): Promise<NextResponse> {
  const localEvents: AgentEvent[] = [];
  const messages: ClaudeMessage[] = [
    {
      role: "user",
      content: `Please generate comprehensive study materials for the topic: "${topic}"\n\nTarget difficulty: ${difficulty}\n\nRemember: you have no source document — use web_search first to gather educational context before generating anything.`,
    },
  ];
  const toolResultsByName: Record<string, unknown> = {};
  let analysis: Analysis | null = null;
  const parallelSafeSet = new Set<string>(PARALLEL_SAFE);

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await callClaudeWithTools(TOPIC_SYSTEM_PROMPT, messages, agentTools);
    const textBlocks = (response.content as ContentBlock[]).filter((b) => b.type === "text");
    for (const b of textBlocks) {
      if (b.text) localEvents.push({ type: "reasoning", text: b.text as string });
    }
    const toolUseBlocks = (response.content as unknown[]).filter(
      (b): b is ToolUseBlock => (b as ToolUseBlock).type === "tool_use"
    );
    if (toolUseBlocks.length === 0) break;
    const results = await executeToolCalls(toolUseBlocks);
    const seqResults = results.filter((r) => !parallelSafeSet.has(r.toolName));
    const parResults = results.filter((r) => parallelSafeSet.has(r.toolName));
    for (const r of results) {
      toolResultsByName[r.toolName] = r.result;
      if (r.toolName === "analyze_content") analysis = r.result as Analysis;
    }
    for (const r of seqResults) {
      localEvents.push({ type: "tool_call", tools: [{ toolName: r.toolName, durationMs: r.durationMs }], parallel: false });
    }
    if (parResults.length > 0) {
      localEvents.push({ type: "tool_call", tools: parResults.map((r) => ({ toolName: r.toolName, durationMs: r.durationMs })), parallel: parResults.length > 1 });
    }
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toToolResultBlocks(results) });
    if (response.stop_reason !== "tool_use") break;
  }

  const materials: GeneratedMaterials = {
    flashcards: (toolResultsByName["generate_flashcards"] as Flashcard[] | undefined) ?? null,
    quiz: toolResultsByName["generate_quiz"] ? { questions: toolResultsByName["generate_quiz"] as QuizQuestion[] } : null,
    studyGuide: toolResultsByName["generate_study_guide"] ? { sections: toolResultsByName["generate_study_guide"] as StudyGuideSection[] } : null,
  };
  return NextResponse.json({ analysis, materials, agentEvents: localEvents });
}

const MAX_CHARS = 150_000; // absolute hard limit before preprocessing
const SUMMARIZE_THRESHOLD = 20_000; // programmatic condensing kicks in above this
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

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let text: string;
    let difficulty: string;

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

      if (topic !== undefined) {
        const fast = validateTopicFast(topic);
        if (!fast.valid) return NextResponse.json({ error: fast.reason }, { status: 400 });

        const model = await validateTopicWithModel(topic);
        if (!model.valid) return NextResponse.json({ error: model.reason }, { status: 400 });

        return await runTopicAgent(topic, difficulty);
      }

      if (!text) {
        return NextResponse.json({ error: "text is required." }, { status: 400 });
      }
    }

    if (text.length > MAX_CHARS) {
      console.warn(`[agent] Document truncated from ${text.length} to ${MAX_CHARS} chars (hard limit)`);
      text = text.slice(0, MAX_CHARS);
    }

    if (text.length > SUMMARIZE_THRESHOLD) {
      const { condensedText } = preprocessDocument(text, 15_000);
      console.log(`[preprocess] Reduced ${text.length} → ${condensedText.length} chars`);
      text = condensedText;
    }

    // ── Content quality gate ────────────────────────────────────────────────
    const validation = await validateContent(text);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    // ── Agent loop ──────────────────────────────────────────────────────────

    const messages: ClaudeMessage[] = [
      {
        role: "user",
        content: `Please analyze and generate study materials for the following content at ${difficulty} difficulty level:\n\n${text}`,
      },
    ];

    const agentEvents: AgentEvent[] = [];
    const toolResultsByName: Record<string, unknown> = {};
    let analysis: Analysis | null = null;

    const parallelSafeSet = new Set<string>(PARALLEL_SAFE);

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await callClaudeWithTools(SYSTEM_PROMPT, messages, agentTools);

      // Capture text blocks as reasoning events (before tool events for this turn)
      const textBlocks = (response.content as ContentBlock[]).filter((b) => b.type === "text");
      for (const b of textBlocks) {
        if (b.text) agentEvents.push({ type: "reasoning", text: b.text as string });
      }

      // Find tool calls
      const toolUseBlocks = (response.content as unknown[]).filter(
        (b): b is ToolUseBlock => (b as ToolUseBlock).type === "tool_use"
      );

      if (toolUseBlocks.length === 0) break; // Claude is done

      // Execute tools (parallel when safe)
      const results = await executeToolCalls(toolUseBlocks);

      // Collect results and build events
      const seqResults = results.filter((r) => !parallelSafeSet.has(r.toolName));
      const parResults = results.filter((r) => parallelSafeSet.has(r.toolName));

      for (const r of results) {
        toolResultsByName[r.toolName] = r.result;
        if (r.toolName === "analyze_content") {
          analysis = r.result as Analysis;
        }
      }

      // Sequential tools → individual events
      for (const r of seqResults) {
        agentEvents.push({
          type: "tool_call",
          tools: [{ toolName: r.toolName, durationMs: r.durationMs }],
          parallel: false,
        });
      }

      // Parallel tools → single grouped event
      if (parResults.length > 0) {
        agentEvents.push({
          type: "tool_call",
          tools: parResults.map((r) => ({ toolName: r.toolName, durationMs: r.durationMs })),
          parallel: parResults.length > 1,
        });
      }

      // Append assistant response + tool results back to message history
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toToolResultBlocks(results) });

      if (response.stop_reason !== "tool_use") break;
    }

    // ── Assemble GeneratedMaterials ─────────────────────────────────────────

    const materials: GeneratedMaterials = {
      flashcards: (toolResultsByName["generate_flashcards"] as Flashcard[] | undefined) ?? null,
      quiz: toolResultsByName["generate_quiz"]
        ? { questions: toolResultsByName["generate_quiz"] as QuizQuestion[] }
        : null,
      studyGuide: toolResultsByName["generate_study_guide"]
        ? { sections: toolResultsByName["generate_study_guide"] as StudyGuideSection[] }
        : null,
    };

    return NextResponse.json({ analysis, materials, agentEvents });
  } catch (err) {
    console.error("[/api/agent]", err);
    return NextResponse.json(
      { error: "Agent failed to generate study materials. Please try again." },
      { status: 500 }
    );
  }
}
