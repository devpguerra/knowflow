import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTools, type ClaudeMessage, type ContentBlock } from "@/lib/claude";
import { executeToolCalls, toToolResultBlocks } from "@/lib/toolExecutor";
import { agentTools, type ToolUseBlock } from "@/lib/tools";
import { extractTextFromPDF } from "@/lib/pdf";
import type {
  Analysis,
  Flashcard,
  QuizQuestion,
  StudyGuideSection,
  GeneratedMaterials,
  AgentReasoning,
} from "@/types";

const MAX_CHARS = 60_000;
const MAX_TURNS = 10;

const SYSTEM_PROMPT = `You are Knowledge Transformer, an intelligent study agent. You have tools available to analyze content and generate study materials.

Your job is to:
1. First, ALWAYS call analyze_content to understand the source material
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
      } else if (pastedText) {
        text = pastedText;
      } else {
        return NextResponse.json({ error: "Provide either a PDF file or text." }, { status: 400 });
      }
    } else {
      const body = await req.json();
      text = body.text;
      difficulty = body.difficulty ?? "intermediate";
      if (!text) {
        return NextResponse.json({ error: "text is required." }, { status: 400 });
      }
    }

    if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

    // ── Agent loop ──────────────────────────────────────────────────────────

    const messages: ClaudeMessage[] = [
      {
        role: "user",
        content: `Please analyze and generate study materials for the following content at ${difficulty} difficulty level:\n\n${text}`,
      },
    ];

    const reasoningTexts: string[] = [];
    const toolTimings: { toolName: string; durationMs: number }[] = [];
    const toolResultsByName: Record<string, unknown> = {};
    let analysis: Analysis | null = null;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await callClaudeWithTools(SYSTEM_PROMPT, messages, agentTools);

      // Capture text blocks as agent reasoning
      const textBlocks = (response.content as ContentBlock[]).filter((b) => b.type === "text");
      for (const b of textBlocks) {
        if (b.text) reasoningTexts.push(b.text as string);
      }

      // Find tool calls
      const toolUseBlocks = (response.content as unknown[]).filter(
        (b): b is ToolUseBlock => (b as ToolUseBlock).type === "tool_use"
      );

      if (toolUseBlocks.length === 0) break; // Claude is done

      // Execute tools (parallel when safe)
      const results = await executeToolCalls(toolUseBlocks);

      // Collect results
      for (const r of results) {
        toolTimings.push({ toolName: r.toolName, durationMs: r.durationMs });
        toolResultsByName[r.toolName] = r.result;
        if (r.toolName === "analyze_content") {
          analysis = r.result as Analysis;
        }
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
      agentReasoning: buildReasoning(reasoningTexts, Object.keys(toolResultsByName)),
    };

    return NextResponse.json({ analysis, materials, toolTimings });
  } catch (err) {
    console.error("[/api/agent]", err);
    return NextResponse.json(
      { error: "Agent failed to generate study materials. Please try again." },
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
