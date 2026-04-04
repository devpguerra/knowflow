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
  title: "Python Programming: Core Concepts for Beginners",
  summary:
    "An introduction to Python covering variables, data types, control flow, functions, and lists — the building blocks every Python developer needs.",
  concepts: [
    {
      name: "Variables & Data Types",
      description: "Named containers that store values; Python supports int, float, str, and bool with dynamic typing.",
      difficulty: "easy",
      importance: "high",
    },
    {
      name: "Control Flow",
      description: "if/elif/else statements and while loops that direct the execution path of a program.",
      difficulty: "easy",
      importance: "high",
    },
    {
      name: "Functions",
      description: "Reusable blocks of code defined with the `def` keyword that accept parameters and return values.",
      difficulty: "medium",
      importance: "high",
    },
    {
      name: "Lists & Iteration",
      description: "Ordered, mutable collections and the `for` loop used to process each element.",
      difficulty: "easy",
      importance: "medium",
    },
    {
      name: "String Manipulation",
      description: "Working with text using string methods like .upper(), .split(), and f-strings.",
      difficulty: "easy",
      importance: "medium",
    },
  ],
  estimatedStudyTime: "25 minutes",
  topicAreas: ["Variables", "Functions", "Control Flow"],
};

const MOCK_WEB_SEARCH: unknown = {
  query: "python programming basics for beginners",
  summary:
    "Python is a high-level, dynamically-typed programming language known for its readable syntax. Key beginner topics include variables, data types (int, float, str, bool), control flow (if/else, for/while loops), functions (def keyword), and built-in data structures like lists and dictionaries.",
  keyFacts: [
    "Python uses indentation (whitespace) to define code blocks",
    "Variables are dynamically typed — no need to declare the type",
    "Functions are defined with `def function_name(params):`",
    "Lists are mutable ordered collections: `my_list = [1, 2, 3]`",
    "f-strings allow inline expressions: `f'Hello, {name}'`",
  ],
  relatedConcepts: ["indentation", "dynamic typing", "built-in functions", "modules", "scope"],
  sources: ["Python.org docs", "General knowledge"],
};

const MOCK_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-1",
    front: "What is a variable in Python?",
    back: "A named container that stores a value. Example: `age = 25`",
    concept: "Variables & Data Types",
    difficulty: "easy",
  },
  {
    id: "fc-2",
    front: "What does the `def` keyword do?",
    back: "It defines a new function. Example: `def greet(name): return f'Hello, {name}'`",
    concept: "Functions",
    difficulty: "easy",
  },
  {
    id: "fc-3",
    front: "How do you create a list in Python?",
    back: "Using square brackets: `my_list = [1, 2, 3]`. Lists are ordered and mutable.",
    concept: "Lists & Iteration",
    difficulty: "easy",
  },
  {
    id: "fc-4",
    front: "What is the output of `len(\"hello\")`?",
    back: "5 — the `len()` built-in returns the number of characters in a string.",
    concept: "String Manipulation",
    difficulty: "easy",
  },
];

const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q-1",
    question: "Which keyword is used to define a function in Python?",
    type: "multiple_choice",
    options: ["func", "function", "def", "define"],
    correctAnswer: 2,
    explanation: "The `def` keyword introduces a function definition. Example: `def my_func():`",
    concept: "Functions",
  },
  {
    id: "q-2",
    question: "What data type does `type(3.14)` return?",
    type: "multiple_choice",
    options: ["int", "str", "float", "double"],
    correctAnswer: 2,
    explanation: "3.14 is a floating-point number, so `type(3.14)` returns `<class 'float'>`.",
    concept: "Variables & Data Types",
  },
  {
    id: "q-3",
    question: "Which loop is used to iterate over a list in Python?",
    type: "multiple_choice",
    options: ["while", "foreach", "loop", "for"],
    correctAnswer: 3,
    explanation: "The `for` loop iterates over any iterable. Example: `for item in my_list:`",
    concept: "Lists & Iteration",
  },
];

const MOCK_STUDY_GUIDE_SECTIONS: StudyGuideSection[] = [
  {
    title: "Variables & Data Types",
    content:
      "In Python, a variable is a name that refers to a value stored in memory. You create one with a simple assignment: `x = 10`. Python is dynamically typed, meaning you don't declare the type — Python figures it out. The four core primitive types are `int` (whole numbers), `float` (decimals), `str` (text in quotes), and `bool` (`True` or `False`). Use the built-in `type()` function to inspect any value's type at runtime.",
    keyTakeaways: [
      "No type declarations needed — Python infers types automatically",
      "Four core types: int, float, str, bool",
      "`type(value)` tells you what type a value is",
    ],
    sources: [
      { title: "Python Built-in Types – Python Docs", url: "https://docs.python.org/3/library/stdtypes.html" },
      { title: "Variables – Real Python", url: "https://realpython.com/python-variables/" },
    ],
  },
  {
    title: "Functions",
    content:
      "Functions let you package a block of code under a name so you can reuse it. Define one with `def`, give it a name, list its parameters in parentheses, and indent the body. Use `return` to send a value back to the caller. If you omit `return`, the function returns `None`. Functions make code easier to read, test, and maintain by avoiding repetition.",
    keyTakeaways: [
      "Define functions with `def name(params):`",
      "Use `return` to send a result back",
      "Functions reduce repetition and improve readability",
    ],
    sources: [
      { title: "Defining Functions – Python Docs", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions" },
      { title: "Functions – Real Python", url: "https://realpython.com/defining-your-own-python-function/" },
    ],
  },
];

const MOCK_ASSESSMENT: KnowledgeGapAssessment = {
  weakConcepts: [
    { name: "Functions", severity: "high" },
    { name: "Lists & Iteration", severity: "medium" },
  ],
  strategy:
    "Focus on writing small functions from scratch and tracing through for-loops manually. Practice defining functions with parameters and return values, then iterate over lists step by step to build intuition.",
  recommendedActions: [
    "Write a function that takes two numbers and returns their sum.",
    "Create a list of 5 items and print each one using a for loop.",
    "Add a default parameter to a function and call it with and without that argument.",
    "Use the `len()` function inside a loop to track your position in a list.",
  ],
};

// ── Mock concepts (used in mock tool_use sequences) ────────────────────────

const MOCK_CONCEPTS = [
  {
    name: "Variables & Data Types",
    context: "Named containers that store values; Python supports int, float, str, and bool with dynamic typing.",
  },
  {
    name: "Functions",
    context: "Reusable blocks of code defined with `def` that accept parameters and return values.",
  },
];

// ── callClaude mock (used by toolExecutor prompt→result calls) ─────────────

async function callClaudeMock(prompt: string): Promise<unknown> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const lower = prompt.toLowerCase();

  if (lower.startsWith("you are a topic quality checker")) return { valid: true, reason: "" };
  if (lower.startsWith("you are a content quality checker")) return { valid: true, reason: "" };
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
          { type: "text", text: "I'll analyze the quiz results to identify exactly where the student needs more practice." },
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
                    concept: "Functions",
                    question: "Which keyword is used to define a function in Python?",
                    user_answer: "func",
                    correct_answer: "def",
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
            text: "The student scored 67% — a moderate review is appropriate. I'll generate focused flashcards on Python functions and a targeted retake quiz.",
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
          text: "Here's your personalized review pack. You're on the right track — a bit more practice with functions and you'll have it locked in!",
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
          text: "The material covers Python fundamentals with a mix of syntax and practical concepts. I'll generate flashcards for active recall of key syntax, a study guide for deeper understanding, and a quiz to test comprehension.",
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
        text: "I've analyzed your material and generated comprehensive Python study materials. You'll find flashcards for syntax recall, a structured study guide for deeper understanding, and a quiz to test your knowledge.",
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
