// ── Tool input types ──────────────────────────────────────────────────────
// Typed inputs for each tool so toolExecutor.ts can be fully typed.

export interface AnalyzeContentInput {
  text: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface WebSearchInput {
  query: string;
}

export interface ConceptRef {
  name: string;
  context: string;
}

export interface GenerateFlashcardsInput {
  concepts: ConceptRef[];
  count: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface GenerateQuizInput {
  concepts: ConceptRef[];
  count: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  question_types?: Array<"multiple_choice" | "true_false">;
}

export interface GenerateStudyGuideInput {
  concepts: ConceptRef[];
  depth: "overview" | "detailed" | "comprehensive";
  focus_areas?: string[];
}

export interface AssessKnowledgeGapsInput {
  quiz_results: {
    score: number;
    total: number;
    wrong_answers: Array<{
      concept: string;
      question: string;
      user_answer: string;
      correct_answer: string;
    }>;
  };
}

// Discriminated union of all tool inputs — used in toolExecutor.ts
export type ToolInput =
  | ({ tool: "analyze_content" } & AnalyzeContentInput)
  | ({ tool: "web_search" } & WebSearchInput)
  | ({ tool: "generate_flashcards" } & GenerateFlashcardsInput)
  | ({ tool: "generate_quiz" } & GenerateQuizInput)
  | ({ tool: "generate_study_guide" } & GenerateStudyGuideInput)
  | ({ tool: "assess_knowledge_gaps" } & AssessKnowledgeGapsInput);

// ── Tool name registry ────────────────────────────────────────────────────

export type ToolName =
  | "analyze_content"
  | "web_search"
  | "generate_flashcards"
  | "generate_quiz"
  | "generate_study_guide"
  | "assess_knowledge_gaps";

// Tools that produce independent outputs and can execute simultaneously.
// When Claude requests several of these in one response, run them with Promise.all.
export const PARALLEL_SAFE: ToolName[] = [
  "generate_flashcards",
  "generate_quiz",
  "generate_study_guide",
];

// Tools whose output informs Claude's next decision — must complete before
// the next Claude API call.
export const SEQUENTIAL: ToolName[] = [
  "analyze_content",
  "web_search",
  "assess_knowledge_gaps",
];

// ── Anthropic tool-use block shapes ──────────────────────────────────────
// Mirrors the shapes Claude returns in its API responses.

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: ToolName;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string; // JSON-serialised result
}

// ── Tool definitions (sent to Claude in every API request) ───────────────

export const agentTools = [
  {
    name: "analyze_content" as const,
    description:
      "Analyze source material to identify key concepts, structure, difficulty levels, and topic areas. Always call this first to understand the material before generating anything.",
    input_schema: {
      type: "object" as const,
      properties: {
        text: {
          type: "string",
          description: "The source text to analyze",
        },
        difficulty: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced"],
          description: "Target difficulty level",
        },
      },
      required: ["text", "difficulty"],
    },
  },

  {
    name: "web_search" as const,
    description:
      "Search the web for supplementary information when the source material references concepts that need more context or when the user provides just a topic instead of source material. Use this to enrich the knowledge base before generating materials.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query for supplementary information",
        },
      },
      required: ["query"],
    },
  },

  {
    name: "generate_flashcards" as const,
    description:
      "Generate flashcards for key terms, concepts, and facts. Best for material with terminology, definitions, or factual content that benefits from active recall practice.",
    input_schema: {
      type: "object" as const,
      properties: {
        concepts: {
          type: "array",
          description: "Concepts to create flashcards for",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              context: { type: "string" },
            },
            required: ["name", "context"],
          },
        },
        count: {
          type: "number",
          description: "Number of flashcards to generate",
        },
        difficulty: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced"],
        },
      },
      required: ["concepts", "count", "difficulty"],
    },
  },

  {
    name: "generate_quiz" as const,
    description:
      "Generate quiz questions to test understanding. Supports multiple_choice and true_false. Best for testing comprehension, application, and critical thinking.",
    input_schema: {
      type: "object" as const,
      properties: {
        concepts: {
          type: "array",
          description: "Concepts to test",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              context: { type: "string" },
            },
            required: ["name", "context"],
          },
        },
        count: {
          type: "number",
          description: "Number of questions",
        },
        difficulty: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced"],
        },
        question_types: {
          type: "array",
          description: "Types of questions to include",
          items: {
            type: "string",
            enum: ["multiple_choice", "true_false"],
          },
        },
      },
      required: ["concepts", "count", "difficulty"],
    },
  },

  {
    name: "generate_study_guide" as const,
    description:
      "Generate a structured narrative study guide. Best for complex topics that need explanation, context, and connected understanding rather than isolated facts.",
    input_schema: {
      type: "object" as const,
      properties: {
        concepts: {
          type: "array",
          description: "Concepts to cover",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              context: { type: "string" },
            },
            required: ["name", "context"],
          },
        },
        depth: {
          type: "string",
          enum: ["overview", "detailed", "comprehensive"],
          description: "How deep to go",
        },
        focus_areas: {
          type: "array",
          description: "Specific areas to emphasize",
          items: { type: "string" },
        },
      },
      required: ["concepts", "depth"],
    },
  },

  {
    name: "assess_knowledge_gaps" as const,
    description:
      "Analyze quiz results to identify knowledge gaps and recommend a review strategy. Determines which concepts need reinforcement and what type of review materials would be most effective.",
    input_schema: {
      type: "object" as const,
      properties: {
        quiz_results: {
          type: "object",
          properties: {
            score: { type: "number" },
            total: { type: "number" },
            wrong_answers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  concept: { type: "string" },
                  question: { type: "string" },
                  user_answer: { type: "string" },
                  correct_answer: { type: "string" },
                },
                required: ["concept", "question", "user_answer", "correct_answer"],
              },
            },
          },
          required: ["score", "total", "wrong_answers"],
        },
      },
      required: ["quiz_results"],
    },
  },
] as const;

export type AgentTool = (typeof agentTools)[number];
