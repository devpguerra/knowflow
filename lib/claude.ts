import type { AgentTool } from "@/lib/tools";
import type {
  Analysis,
  Flashcard,
  QuizQuestion,
  StudyGuideSection,
  KnowledgeGapAssessment,
} from "@/types";

// ── Shared types ───────────────────────────────────────────────────────────

export type ContentBlock = Record<string, unknown>;

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: unknown;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_ANALYSIS: Analysis = {
  title: "Biology: Photosynthesis & Cell Respiration",
  summary:
    "An overview of how plants convert light energy into chemical energy and how cells produce ATP through respiration.",
  concepts: [
    {
      name: "Photosynthesis",
      description: "The process by which plants convert sunlight into glucose using CO2 and water.",
      difficulty: "medium",
      importance: "high",
    },
    {
      name: "Cell Respiration",
      description: "The process cells use to break down glucose and produce ATP.",
      difficulty: "medium",
      importance: "high",
    },
    {
      name: "ATP Production",
      description: "Adenosine triphosphate synthesis via the electron transport chain.",
      difficulty: "hard",
      importance: "high",
    },
    {
      name: "Light Reactions",
      description: "The first stage of photosynthesis that captures light energy.",
      difficulty: "medium",
      importance: "medium",
    },
    {
      name: "Calvin Cycle",
      description: "The second stage of photosynthesis that fixes CO2 into glucose.",
      difficulty: "hard",
      importance: "medium",
    },
  ],
  estimatedStudyTime: "20 minutes",
  topicAreas: ["Photosynthesis", "Cell Respiration", "ATP Production"],
};

const MOCK_WEB_SEARCH: unknown = {
  query: "photosynthesis cell respiration",
  summary:
    "Photosynthesis and cellular respiration are complementary processes. Plants use sunlight, CO2, and water to produce glucose and oxygen. Cells then break down glucose to produce ATP through glycolysis, the Krebs cycle, and oxidative phosphorylation.",
  keyFacts: [
    "Photosynthesis equation: 6CO2 + 6H2O + light → C6H12O6 + 6O2",
    "Cellular respiration equation: C6H12O6 + 6O2 → 6CO2 + 6H2O + ~32 ATP",
    "Chloroplasts are the site of photosynthesis",
    "Mitochondria are the site of aerobic respiration",
    "ATP stands for adenosine triphosphate",
  ],
  relatedConcepts: ["chlorophyll", "NADPH", "electron transport chain", "glycolysis", "Krebs cycle"],
  sources: ["Wikipedia", "General knowledge"],
};

const MOCK_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-1",
    front: "What is photosynthesis?",
    back: "The process by which plants convert sunlight into glucose using CO2 and water.",
    concept: "Photosynthesis",
    difficulty: "easy",
  },
  {
    id: "fc-2",
    front: "What is ATP?",
    back: "Adenosine triphosphate — the energy currency of the cell.",
    concept: "ATP Production",
    difficulty: "easy",
  },
  {
    id: "fc-3",
    front: "Where does photosynthesis occur?",
    back: "In the chloroplasts of plant cells.",
    concept: "Photosynthesis",
    difficulty: "easy",
  },
  {
    id: "fc-4",
    front: "What are the two stages of photosynthesis?",
    back: "The light reactions and the Calvin cycle.",
    concept: "Photosynthesis",
    difficulty: "medium",
  },
];

const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q-1",
    question: "Where does photosynthesis occur?",
    type: "multiple_choice",
    options: ["Mitochondria", "Chloroplast", "Nucleus", "Ribosome"],
    correctAnswer: 1,
    explanation: "Photosynthesis takes place in the chloroplasts, which contain chlorophyll.",
    concept: "Photosynthesis",
  },
  {
    id: "q-2",
    question: "What molecule is considered the 'energy currency' of the cell?",
    type: "multiple_choice",
    options: ["DNA", "Glucose", "ATP", "NADPH"],
    correctAnswer: 2,
    explanation: "ATP (Adenosine Triphosphate) stores and transfers energy within cells.",
    concept: "ATP Production",
  },
  {
    id: "q-3",
    question: "Which gas is released as a byproduct of photosynthesis?",
    type: "multiple_choice",
    options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"],
    correctAnswer: 2,
    explanation: "Oxygen is released when water molecules are split during the light reactions.",
    concept: "Photosynthesis",
  },
];

const MOCK_STUDY_GUIDE_SECTIONS: StudyGuideSection[] = [
  {
    title: "Photosynthesis",
    content:
      "Photosynthesis converts light energy into chemical energy stored as glucose. It occurs in the chloroplasts of plant cells and requires sunlight, CO2, and water. The overall equation is: 6CO2 + 6H2O + light → C6H12O6 + 6O2.",
    keyTakeaways: [
      "Occurs in chloroplasts",
      "Requires sunlight, CO2, and water",
      "Produces glucose and oxygen",
    ],
    sources: [
      { title: "Photosynthesis – Wikipedia", url: "https://en.wikipedia.org/wiki/Photosynthesis" },
      { title: "Khan Academy", url: "https://www.khanacademy.org/science/ap-biology/cellular-energetics/photosynthesis/a/intro-to-photosynthesis" },
    ],
  },
  {
    title: "ATP Production",
    content:
      "ATP (Adenosine Triphosphate) is the primary energy currency of the cell. It is produced during both photosynthesis (light reactions) and cellular respiration (oxidative phosphorylation). Each glucose molecule yields approximately 30–32 ATP.",
    keyTakeaways: [
      "ATP = energy currency of the cell",
      "Produced in mitochondria and chloroplasts",
      "~30–32 ATP per glucose molecule",
    ],
    sources: [
      { title: "ATP – Wikipedia", url: "https://en.wikipedia.org/wiki/Adenosine_triphosphate" },
      { title: "Cellular Respiration – Khan Academy", url: "https://www.khanacademy.org/science/ap-biology/cellular-energetics/cellular-respiration-ap/a/steps-of-cellular-respiration" },
    ],
  },
];

const MOCK_ASSESSMENT: KnowledgeGapAssessment = {
  weakConcepts: [
    { name: "ATP Production", severity: "high" },
    { name: "Light Reactions", severity: "medium" },
  ],
  strategy:
    "Focus on the energy transfer pathways — specifically how ATP is synthesized during the light reactions and the electron transport chain. Review the relationship between NADPH and the Calvin cycle.",
  recommendedActions: [
    "Draw a diagram of the ATP synthesis process step by step.",
    "Trace the path of a single electron through the light reactions.",
    "Compare and contrast the light reactions vs. the Calvin cycle side by side.",
    "Re-read the section on oxidative phosphorylation with focused attention.",
  ],
};

// ── Mock concepts (used in mock tool_use sequences) ────────────────────────

const MOCK_CONCEPTS = [
  {
    name: "Photosynthesis",
    context: "The process by which plants convert sunlight into glucose using CO2 and water.",
  },
  {
    name: "Cell Respiration",
    context: "The process cells use to break down glucose and produce ATP.",
  },
];

// ── callClaude mock (used by toolExecutor prompt→result calls) ─────────────

async function callClaudeMock(prompt: string): Promise<unknown> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const lower = prompt.toLowerCase();

  if (lower.startsWith("analyze the following source material")) return MOCK_ANALYSIS;
  if (lower.startsWith("you are a research assistant")) return MOCK_WEB_SEARCH;
  if (lower.startsWith("generate") && lower.includes("flashcards")) return MOCK_FLASHCARDS;
  if (lower.startsWith("generate") && lower.includes("quiz questions")) return MOCK_QUIZ_QUESTIONS;
  if (lower.startsWith("generate") && lower.includes("study guide")) return MOCK_STUDY_GUIDE_SECTIONS;
  if (lower.startsWith("analyze these quiz results")) return MOCK_ASSESSMENT;

  throw new Error(
    `callClaude (mock): unrecognized prompt type.\nPrompt starts with: "${prompt.slice(0, 100)}"`
  );
}

// ── callClaudeWithTools mock (simulates Claude's tool-use decisions) ────────

async function callClaudeWithToolsMock(
  systemPrompt: string,
  messages: ClaudeMessage[],
  _tools: readonly AgentTool[]
): Promise<{ content: ContentBlock[]; stop_reason: string }> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const isReview = systemPrompt.toLowerCase().includes("review agent");
  // Each round adds 2 messages (assistant + user/tool_results), starting from 1 user message.
  const turn = Math.floor(messages.length / 2);

  if (isReview) {
    if (turn === 0) {
      return {
        content: [
          { type: "text", text: "I'll analyze the quiz results to identify exactly where the student struggled." },
          {
            type: "tool_use",
            id: "mock-rv-1",
            name: "assess_knowledge_gaps",
            input: {
              quiz_results: {
                score: 2,
                total: 3,
                wrong_answers: [
                  {
                    concept: "ATP Production",
                    question: "What molecule is considered the 'energy currency' of the cell?",
                    user_answer: "Glucose",
                    correct_answer: "ATP",
                  },
                ],
              },
            },
          },
        ],
        stop_reason: "tool_use",
      };
    }
    if (turn === 1) {
      return {
        content: [
          {
            type: "text",
            text: "The student scored 67% — a moderate review is appropriate. I'll generate focused flashcards for the missed concepts and a targeted retake quiz.",
          },
          {
            type: "tool_use",
            id: "mock-rv-2",
            name: "generate_flashcards",
            input: { concepts: MOCK_CONCEPTS, count: 2, difficulty: "beginner" },
          },
          {
            type: "tool_use",
            id: "mock-rv-3",
            name: "generate_quiz",
            input: {
              concepts: MOCK_CONCEPTS,
              count: 2,
              difficulty: "beginner",
              question_types: ["multiple_choice"],
            },
          },
        ],
        stop_reason: "tool_use",
      };
    }
    return {
      content: [
        {
          type: "text",
          text: "Here's your personalized review pack. You're doing well — just a bit more focus on ATP Production and you'll have it locked in!",
        },
      ],
      stop_reason: "end_turn",
    };
  }

  // Main agent
  if (turn === 0) {
    return {
      content: [
        {
          type: "text",
          text: "I'll start by analyzing the source material to understand the key concepts and structure.",
        },
        {
          type: "tool_use",
          id: "mock-ma-1",
          name: "analyze_content",
          input: { text: "mock source text", difficulty: "intermediate" },
        },
      ],
      stop_reason: "tool_use",
    };
  }
  if (turn === 1) {
    return {
      content: [
        {
          type: "text",
          text: "The material covers biological processes with a mix of terminology and conceptual content. I'll generate flashcards for active recall of key terms, a detailed study guide for deeper understanding, and a quiz to test comprehension.",
        },
        {
          type: "tool_use",
          id: "mock-ma-2",
          name: "generate_flashcards",
          input: { concepts: MOCK_CONCEPTS, count: 4, difficulty: "intermediate" },
        },
        {
          type: "tool_use",
          id: "mock-ma-3",
          name: "generate_quiz",
          input: {
            concepts: MOCK_CONCEPTS,
            count: 3,
            difficulty: "intermediate",
            question_types: ["multiple_choice"],
          },
        },
        {
          type: "tool_use",
          id: "mock-ma-4",
          name: "generate_study_guide",
          input: { concepts: MOCK_CONCEPTS, depth: "detailed" },
        },
      ],
      stop_reason: "tool_use",
    };
  }
  return {
    content: [
      {
        type: "text",
        text: "I've analyzed your document and generated comprehensive study materials tailored to your content. You'll find flashcards for active recall, a structured study guide for deeper understanding, and a quiz to test your knowledge.",
      },
    ],
    stop_reason: "end_turn",
  };
}

// ── Real implementations ───────────────────────────────────────────────────

async function callClaudeOnce(prompt: string): Promise<unknown> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const text: string = data.content[0].text;

  try {
    return JSON.parse(text);
  } catch {
    // Response may be truncated (max_tokens). Try to salvage completed sections.
    if (data.stop_reason === "max_tokens") {
      const salvaged = salvagePartialJSON(text);
      if (salvaged !== null) return salvaged;
    }
    throw new Error(`Claude returned invalid JSON:\n${text.slice(0, 300)}`);
  }
}

/** Try to extract a valid JSON value from a truncated string by progressively trimming. */
function salvagePartialJSON(text: string): unknown {
  // 1. Maybe only the closing bracket is missing
  try { return JSON.parse(text + "]"); } catch {}
  // 2. Truncate after the last complete object (ends with },)
  const lastCommaClose = text.lastIndexOf("},");
  if (lastCommaClose !== -1) {
    try { return JSON.parse(text.slice(0, lastCommaClose + 1) + "]"); } catch {}
  }
  // 3. Truncate after the last closing brace
  const lastBrace = text.lastIndexOf("}");
  if (lastBrace !== -1) {
    try { return JSON.parse(text.slice(0, lastBrace + 1) + "]"); } catch {}
  }
  return null;
}

async function callClaudeReal(prompt: string): Promise<unknown> {
  try {
    return await callClaudeOnce(prompt);
  } catch (firstErr) {
    console.warn("[callClaude] First attempt failed, retrying…", firstErr);
    return await callClaudeOnce(prompt);
  }
}

async function callClaudeWithToolsReal(
  systemPrompt: string,
  messages: ClaudeMessage[],
  tools: readonly AgentTool[]
): Promise<{ content: ContentBlock[]; stop_reason: string }> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return { content: data.content as ContentBlock[], stop_reason: data.stop_reason as string };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Single-turn Claude call returning parsed JSON.
 * Used by toolExecutor to execute individual tool prompts.
 * Set CLAUDE_MOCK=true in .env.local to skip real API calls.
 */
export async function callClaude(prompt: string): Promise<unknown> {
  if (process.env.CLAUDE_MOCK === "true") return callClaudeMock(prompt);
  return callClaudeReal(prompt);
}

/**
 * Multi-turn Claude call with tool definitions.
 * Used by the agent orchestrator routes to run the agentic loop.
 * Returns the full response (content blocks + stop_reason) for loop control.
 */
export async function callClaudeWithTools(
  systemPrompt: string,
  messages: ClaudeMessage[],
  tools: readonly AgentTool[]
): Promise<{ content: ContentBlock[]; stop_reason: string }> {
  if (process.env.CLAUDE_MOCK === "true") return callClaudeWithToolsMock(systemPrompt, messages, tools);
  return callClaudeWithToolsReal(systemPrompt, messages, tools);
}
