import { callClaude } from "@/lib/claude";
import {
  PARALLEL_SAFE,
  type ToolUseBlock,
  type ToolName,
  type AnalyzeContentInput,
  type WebSearchInput,
  type GenerateFlashcardsInput,
  type GenerateQuizInput,
  type GenerateStudyGuideInput,
  type AssessKnowledgeGapsInput,
  type ConceptRef,
} from "@/lib/tools";

const JSON_ONLY = "Respond ONLY with valid JSON. No markdown fences, no preamble.";

// ── Return type ────────────────────────────────────────────────────────────

export interface ToolCallResult {
  toolUseId: string;
  toolName: ToolName;
  result: unknown;
  durationMs: number;
}

// ── Prompt builders ────────────────────────────────────────────────────────

function conceptList(concepts: ConceptRef[]): string {
  return concepts.map((c) => `- ${c.name}: ${c.context}`).join("\n");
}

function promptFor(block: ToolUseBlock): string {
  const { name, input } = block;

  switch (name) {
    case "analyze_content": {
      const { text, difficulty } = input as unknown as AnalyzeContentInput;
      return `Analyze the following source material. Target difficulty level: ${difficulty}.

Source text:
"""
${text}
"""

Return a JSON object with this exact shape:
{
  "title": "string — inferred title",
  "summary": "string — 2-3 sentence overview",
  "concepts": [
    {
      "name": "string",
      "description": "string — one sentence",
      "difficulty": "easy | medium | hard",
      "importance": "low | medium | high"
    }
  ],
  "estimatedStudyTime": "string — e.g. '20 minutes'",
  "topicAreas": ["string"]
}

${JSON_ONLY}`;
    }

    case "web_search": {
      // ── Simulated web search ──────────────────────────────────────────────
      // No real search API is wired up yet. Claude synthesises supplementary
      // context from training knowledge instead.
      // TODO: replace with a real search provider (Brave, Serper, Tavily, etc.)
      // and inject the results into the prompt before calling Claude.
      const { query } = input as unknown as WebSearchInput;
      return `You are a research assistant. A student is studying a topic and needs supplementary context.

Search query: "${query}"

Based on your knowledge, provide helpful educational context about this topic. Include key facts, definitions, and background that would help someone study it.

Return a JSON object with this exact shape:
{
  "query": "${query}",
  "summary": "string — 2-4 sentence overview of the topic",
  "keyFacts": ["string — important facts or definitions"],
  "relatedConcepts": ["string — related terms worth knowing"],
  "sources": ["Wikipedia", "General knowledge"]
}

${JSON_ONLY}`;
    }

    case "generate_flashcards": {
      const { concepts, count, difficulty } = input as unknown as GenerateFlashcardsInput;
      return `Generate ${count} flashcards at ${difficulty} difficulty for the following concepts:

${conceptList(concepts)}

Rules:
- Each card tests ONE specific fact or definition
- Front: a clear question or prompt that requires active recall
- Back: a concise, accurate answer (1-3 sentences max)
- Vary question styles: definitions, "what is", "how does", "why does", fill-in-the-blank

Return a JSON array where each element has:
{
  "id": "string — unique, e.g. 'fc-1'",
  "front": "string — question or prompt",
  "back": "string — answer",
  "concept": "string — which concept this card covers",
  "difficulty": "easy | medium | hard"
}

${JSON_ONLY}`;
    }

    case "generate_quiz": {
      const { concepts, count, difficulty, question_types } = input as unknown as GenerateQuizInput;
      const types = question_types?.length ? question_types : ["multiple_choice"];
      const typeNote = types.includes("true_false")
        ? 'Mix multiple_choice (4 options) and true_false (options: ["True","False"]) questions.'
        : "All questions are multiple_choice with exactly 4 options.";
      return `Generate ${count} quiz questions at ${difficulty} difficulty for the following concepts:

${conceptList(concepts)}

${typeNote}

Rules:
- correctAnswer is the zero-based index of the correct option
- Distractors should be plausible, not obviously wrong
- Explanation should clarify WHY the answer is correct

Return a JSON array where each element has:
{
  "id": "string — unique, e.g. 'q-1'",
  "question": "string",
  "type": "multiple_choice | true_false",
  "options": ["string", ...],
  "correctAnswer": 0,
  "explanation": "string — why this answer is correct",
  "concept": "string — which concept this tests"
}

${JSON_ONLY}`;
    }

    case "generate_study_guide": {
      const { concepts, depth, focus_areas } = input as unknown as GenerateStudyGuideInput;
      const focusNote = focus_areas?.length
        ? `\nPay special attention to: ${focus_areas.join(", ")}.`
        : "";
      const depthNote =
        depth === "overview"
          ? "Keep each section to 1 short paragraph (max 80 words). No fluff."
          : depth === "detailed"
          ? "Each section: 1-2 concise paragraphs with one short code example if relevant (max 150 words total)."
          : "Each section: 2 focused paragraphs with one short code example if relevant (max 220 words total).";
      return `Generate a ${depth} study guide for the following concepts:

${conceptList(concepts)}
${focusNote}

${depthNote}

Return a JSON array where each element is a section:
{
  "title": "string — section heading",
  "content": "string — explanatory text (use \\n for paragraph breaks, respect the word limit above)",
  "keyTakeaways": ["string — 5 words max per bullet"],
  "sources": [{ "title": "string — short display name", "url": "string — full https URL" }]
}

Code formatting rules (IMPORTANT — this guide may cover programming topics):
- If you include ANY code example, put it in a fenced code block on its own lines: start the block with \`\`\`lang (e.g. \`\`\`python), write each line of code on its own line, then close with \`\`\`.
- NEVER inline code with backticks inside a prose sentence (e.g. do NOT write "use \`x = 5\` to assign"). Instead, place the code in a fenced block after the sentence that refers to it.
- NEVER embed \\n inside a backtick span to represent multi-line code — always use a proper fenced block.
- For REPL examples use the >>> prefix on each line inside the fenced block.

For sources: include 1–3 authoritative reference links per section (Wikipedia articles, official docs, reputable educational sites). Only include URLs you are confident exist.
Limit keyTakeaways to 2 bullets per section. Keep the total JSON response under 2000 tokens.

${JSON_ONLY}`;
    }

    case "assess_knowledge_gaps": {
      const { quiz_results } = input as unknown as AssessKnowledgeGapsInput;
      const pct = Math.round((quiz_results.score / quiz_results.total) * 100);
      const wrongList = quiz_results.wrong_answers
        .map(
          (w) =>
            `- Concept: ${w.concept}\n  Q: ${w.question}\n  Student answered: ${w.user_answer}\n  Correct: ${w.correct_answer}`
        )
        .join("\n");
      return `Analyze these quiz results and identify exactly where the student struggled.

Score: ${quiz_results.score}/${quiz_results.total} (${pct}%)

Wrong answers:
${wrongList || "None — perfect score."}

Based on the pattern of mistakes, determine:
1. Which concepts need reinforcement (and how severely)
2. The best review strategy given the score
3. Concrete actions the student should take

Return a JSON object with this exact shape:
{
  "weakConcepts": [
    {
      "name": "string — concept name",
      "severity": "low | medium | high"
    }
  ],
  "strategy": "string — 2-3 sentences describing the recommended review approach",
  "recommendedActions": ["string — specific, actionable study steps"]
}

${JSON_ONLY}`;
    }

    default: {
      const _exhaustive: never = name;
      throw new Error(`Unknown tool: ${_exhaustive}`);
    }
  }
}

// ── Single tool executor ───────────────────────────────────────────────────

async function runTool(block: ToolUseBlock, useMock = false): Promise<ToolCallResult> {
  const start = Date.now();
  const prompt = promptFor(block);
  const result = await callClaude(prompt, useMock);
  const durationMs = Date.now() - start;
  console.log(`[${block.name}] completed in ${durationMs}ms`);
  return {
    toolUseId: block.id,
    toolName: block.name,
    result,
    durationMs,
  };
}

// ── Main entry point ───────────────────────────────────────────────────────

/**
 * Executes a batch of tool_use blocks from a Claude response.
 *
 * - PARALLEL_SAFE tools (generate_flashcards, generate_quiz, generate_study_guide)
 *   are launched simultaneously with Promise.all.
 * - SEQUENTIAL tools (analyze_content, web_search, assess_knowledge_gaps)
 *   are run one at a time in the order they appear.
 *
 * Sequential tools run first (their output typically seeds the parallel calls),
 * then parallel tools fire together.
 *
 * Returns an array of ToolCallResult in the order they completed.
 */
export async function executeToolCalls(blocks: ToolUseBlock[], useMock = false): Promise<ToolCallResult[]> {
  const parallelBlocks = blocks.filter((b) => (PARALLEL_SAFE as string[]).includes(b.name));
  const sequentialBlocks = blocks.filter((b) => !(PARALLEL_SAFE as string[]).includes(b.name));

  // Sequential first — their results may be needed before parallel kicks off
  const sequentialResults: ToolCallResult[] = [];
  for (const block of sequentialBlocks) {
    sequentialResults.push(await runTool(block, useMock));
  }

  // Parallel — all fire at the same time
  const parallelResults = await Promise.all(parallelBlocks.map((b) => runTool(b, useMock)));

  return [...sequentialResults, ...parallelResults];
}

/**
 * Convenience helper: converts executor results into the tool_result
 * message blocks that must be sent back to Claude in the next API call.
 */
export function toToolResultBlocks(
  results: ToolCallResult[]
): Array<{ type: "tool_result"; tool_use_id: string; content: string }> {
  return results.map((r) => ({
    type: "tool_result",
    tool_use_id: r.toolUseId,
    content: JSON.stringify(r.result),
  }));
}
