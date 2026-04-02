# Knowledge Transformer

AI **agent** that ingests any knowledge source (PDF, text, or topic query), reasons about it, selects and calls tools autonomously, generates multi-format study materials in parallel, quizzes the user, and adaptively regenerates content based on performance gaps.

## Stack

- Next.js 14+ (App Router) with TypeScript
- Tailwind CSS for styling
- Claude API (claude-sonnet-4-20250514) with **tool use** for agentic behavior
- pdf-parse for PDF text extraction
- jspdf for PDF export
- No database — all state in React context/localStorage

## Core Concept: Agent, Not Pipeline

This is NOT a fixed workflow. The backend sends Claude a system prompt + available tools, and Claude **decides** what to do. The orchestration logic lives in Claude's reasoning, not in hardcoded if/else chains.

Key agentic behaviors:
- Agent analyzes content and **decides** which material types are most appropriate
- Agent **decides** whether to search the web for supplementary context
- Agent **reasons** about difficulty and depth per concept
- After quiz, agent **diagnoses** weaknesses and **chooses** a review strategy
- All decisions are visible to the user via an "Agent Reasoning" panel

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                  │
│                                                       │
│  ┌──────────┐  ┌───────────┐  ┌──────┐  ┌─────────┐ │
│  │  Input    │  │ Materials │  │ Quiz │  │ Review  │ │
│  │  Screen   │→ │ Viewer    │→ │      │→ │ + Adapt │ │
│  └──────────┘  └───────────┘  └──────┘  └─────────┘ │
│       │              ▲                       │        │
│       │              │      Agent Reasoning  │        │
│       │              │      Panel visible    │        │
│       │              │      throughout       │        │
└───────┼──────────────┼───────────────────────┼───────┘
        │              │                       │
        ▼              │                       ▼
┌──────────────────────┴───────────────────────────────┐
│              BACKEND (Next.js API Routes)             │
│                                                       │
│  /api/agent        → Main orchestrator endpoint       │
│  /api/agent/review → Review orchestrator endpoint     │
│  /api/export       → CSV/PDF export                   │
│                                                       │
│  Both agent endpoints:                                │
│  1. Send Claude the tools + context                   │
│  2. Claude decides which tools to call                │
│  3. Backend executes tool calls (parallel when safe)  │
│  4. Returns results + agent reasoning to frontend     │
└──────────────────────┬───────────────────────────────┘
                       │
                ┌──────▼──────┐
                │  Claude API  │
                │  (tool use)  │
                └─────────────┘
```

## Tools Definition

These are the tools Claude can choose from. Defined in `lib/tools.ts`:

```typescript
export const agentTools = [
  {
    name: "analyze_content",
    description: "Analyze source material to identify key concepts, structure, difficulty levels, and topic areas. Always call this first to understand the material before generating anything.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The source text to analyze" },
        difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"], description: "Target difficulty level" }
      },
      required: ["text", "difficulty"]
    }
  },
  {
    name: "web_search",
    description: "Search the web for supplementary information when the source material references concepts that need more context or when the user provides just a topic instead of source material. Use this to enrich the knowledge base before generating materials.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for supplementary information" }
      },
      required: ["query"]
    }
  },
  {
    name: "generate_flashcards",
    description: "Generate flashcards for key terms, concepts, and facts. Best for material with terminology, definitions, or factual content that benefits from active recall practice.",
    input_schema: {
      type: "object",
      properties: {
        concepts: { type: "array", items: { type: "object", properties: { name: { type: "string" }, context: { type: "string" } } }, description: "Concepts to create flashcards for" },
        count: { type: "number", description: "Number of flashcards to generate" },
        difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] }
      },
      required: ["concepts", "count", "difficulty"]
    }
  },
  {
    name: "generate_quiz",
    description: "Generate quiz questions to test understanding. Supports multiple choice and true/false. Best for testing comprehension, application, and critical thinking.",
    input_schema: {
      type: "object",
      properties: {
        concepts: { type: "array", items: { type: "object", properties: { name: { type: "string" }, context: { type: "string" } } }, description: "Concepts to test" },
        count: { type: "number", description: "Number of questions" },
        difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
        question_types: { type: "array", items: { type: "string", enum: ["multiple_choice", "true_false"] }, description: "Types of questions to include" }
      },
      required: ["concepts", "count", "difficulty"]
    }
  },
  {
    name: "generate_study_guide",
    description: "Generate a structured narrative study guide. Best for complex topics that need explanation, context, and connected understanding rather than isolated facts.",
    input_schema: {
      type: "object",
      properties: {
        concepts: { type: "array", items: { type: "object", properties: { name: { type: "string" }, context: { type: "string" } } }, description: "Concepts to cover" },
        depth: { type: "string", enum: ["overview", "detailed", "comprehensive"], description: "How deep to go" },
        focus_areas: { type: "array", items: { type: "string" }, description: "Specific areas to emphasize" }
      },
      required: ["concepts", "depth"]
    }
  },
  {
    name: "assess_knowledge_gaps",
    description: "Analyze quiz results to identify knowledge gaps and recommend a review strategy. Determines which concepts need reinforcement and what type of review materials would be most effective.",
    input_schema: {
      type: "object",
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
                  correct_answer: { type: "string" }
                }
              }
            }
          }
        }
      },
      required: ["quiz_results"]
    }
  }
];
```

## Tool Execution Strategy

```typescript
// Tools that can run in parallel (independent outputs)
const PARALLEL_SAFE = ["generate_flashcards", "generate_quiz", "generate_study_guide"];

// Tools that must run sequentially (output feeds into next decision)
const SEQUENTIAL = ["analyze_content", "web_search", "assess_knowledge_gaps"];
```

When Claude requests multiple parallel-safe tools in one response, execute them simultaneously with `Promise.all`. Sequential tools must complete before Claude makes its next decision.

## Key Interfaces

```typescript
interface Analysis {
  title: string;
  summary: string;
  concepts: { name: string; description: string; difficulty: string; importance: string }[];
  estimatedStudyTime: string;
  topicAreas: string[];
}

interface AgentReasoning {
  thought: string;
  decision: string;
  toolsCalled: string[];
  rationale: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  concept: string;
  difficulty: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "true_false";
  options: string[];
  correctAnswer: number;
  explanation: string;
  concept: string;
}

interface StudyGuideSection {
  title: string;
  content: string;
  keyTakeaways: string[];
}

interface GeneratedMaterials {
  studyGuide: { sections: StudyGuideSection[] } | null;
  flashcards: Flashcard[] | null;
  quiz: { questions: QuizQuestion[] } | null;
  agentReasoning: AgentReasoning;
}

interface KnowledgeGapAssessment {
  weakConcepts: { name: string; severity: "low" | "medium" | "high" }[];
  strategy: string;
  recommendedActions: string[];
}

interface ReviewPack {
  assessment: KnowledgeGapAssessment;
  focusedFlashcards: Flashcard[] | null;
  retakeQuiz: { questions: QuizQuestion[] } | null;
  simplifiedGuide: { sections: StudyGuideSection[] } | null;
  agentReasoning: AgentReasoning;
}

interface QuizResult {
  round: number;
  score: number;
  totalQuestions: number;
  missedConcepts: string[];
  wrongAnswers: { questionId: string; concept: string; question: string; userAnswer: number; correctAnswer: number }[];
}
```

## Agent System Prompts

### Main Agent (for /api/agent)

```
You are Knowledge Transformer, an intelligent study agent. You have tools
available to analyze content and generate study materials.

Your job is to:
1. First, ALWAYS call analyze_content to understand the source material
2. Based on your analysis, DECIDE which materials to generate and why:
   - Heavy on terminology? Prioritize flashcards
   - Process-heavy or conceptual? Prioritize study guide
   - Always generate a quiz for assessment
   - If the source references concepts it doesn't explain well, use web_search first
3. Call the generation tools with appropriate parameters
4. Explain your reasoning to the user

Think step by step. After analyze_content, explain what you found and what
you plan to generate before calling the generation tools.

IMPORTANT: When calling multiple generation tools (flashcards, quiz, study_guide),
you may call them all in a single response. The backend will execute them in parallel.
```

### Review Agent (for /api/agent/review)

```
You are Knowledge Transformer's review agent. You have been given quiz results
showing where a user struggled.

Your job is to:
1. Call assess_knowledge_gaps to diagnose the problem
2. Based on the severity and nature of the gaps, DECIDE the review strategy:
   - Score > 80%: Light review — only focused flashcards for missed concepts
   - Score 50-80%: Moderate review — flashcards + simplified study section + retake quiz
   - Score < 50%: Deep review — simplified study guide covering fundamentals + easier quiz
3. Explain your reasoning and encourage the user

Think step by step. The user should feel guided, not judged.
```

## File Structure

```
app/
├── page.tsx                  # Landing: upload + text paste + topic input + difficulty
├── layout.tsx                # Root layout with AppContext provider
├── materials/
│   └── page.tsx              # Materials viewer with tabs
├── quiz/
│   └── page.tsx              # Interactive quiz
├── review/
│   └── page.tsx              # Review pack + progress tracker
├── api/
│   ├── agent/
│   │   ├── route.ts          # Main agent orchestrator
│   │   └── review/route.ts   # Review agent orchestrator
│   └── export/route.ts       # CSV/PDF export
components/
├── UploadZone.tsx
├── DifficultySelector.tsx
├── AgentReasoning.tsx        # Shows agent's thinking process
├── ContentMap.tsx
├── StudyGuide.tsx
├── FlashcardDeck.tsx
├── QuizRunner.tsx
├── ScoreCard.tsx
├── ReviewPack.tsx
├── ProgressTracker.tsx
├── LoadingAgent.tsx          # Animated loading showing current tool being called
lib/
├── claude.ts                 # Claude API wrapper with tool-use support
├── tools.ts                  # Tool definitions
├── toolExecutor.ts           # Executes tool calls, parallelizes when safe
├── pdf.ts                    # PDF text extraction
├── export.ts                 # CSV + PDF export helpers
types/
└── index.ts                  # All TypeScript interfaces
```

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Design Direction

- Clean, modern, distinctive UI — not generic AI aesthetic
- Dark mode by default with an accent color
- Agent Reasoning panel: collapsible card showing the agent's thought process. Use a subtle "thinking" animation while working.
- Parallel generation: show multiple progress indicators filling simultaneously
- Smooth transitions between screens
- Mobile responsive

## Rules

- No database. No auth. Contest demo.
- Claude decides what to generate — don't hardcode "always make flashcards + quiz + guide"
- Every flashcard and quiz question MUST include a `concept` field
- PDF extraction happens server-side only
- Handle errors gracefully with retry logic
- Truncate source text to ~60,000 characters if too long
- Independent tool calls MUST run in parallel via Promise.all
- Agent reasoning must be captured and displayed at every step