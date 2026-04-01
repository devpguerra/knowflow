# Knowledge Transformer

AI agent that ingests any knowledge source (PDF/text), generates multi-format study materials, quizzes the user, and adaptively regenerates content based on performance gaps.

## Stack

- Next.js 14+ (App Router) with TypeScript
- Tailwind CSS for styling
- Claude API (claude-sonnet-4-20250514) for all AI features
- pdf-parse for PDF text extraction
- jspdf for PDF export
- No database — all state in React context/localStorage

## Architecture

```
app/
├── page.tsx                  # Landing: upload zone + text paste + difficulty selector
├── layout.tsx                # Root layout with global state provider
├── api/
│   ├── analyze/route.ts      # Analyze source → returns concepts, structure, metadata
│   ├── generate/route.ts     # Generate study guide + flashcards + quiz as JSON
│   ├── review/route.ts       # Takes wrong answers → generates focused review pack
│   └── export/route.ts       # Export flashcards as CSV or study guide as PDF
components/
├── UploadZone.tsx            # Drag-drop PDF + textarea for pasting
├── DifficultySelector.tsx    # Beginner / Intermediate / Advanced toggle
├── ContentMap.tsx            # Shows analysis results (concepts found, topics, est. time)
├── StudyGuide.tsx            # Rendered markdown study guide
├── FlashcardDeck.tsx         # Flip-card UI with navigation
├── QuizRunner.tsx            # One question at a time, tracks answers
├── ScoreCard.tsx             # Results with per-concept breakdown
├── ReviewPack.tsx            # Focused flashcards + retake quiz for weak areas
├── ProgressTracker.tsx       # Bar/line showing score improvement across rounds
lib/
├── claude.ts                 # Wrapper: calls Claude API, parses JSON response
├── pdf.ts                    # Extract text from uploaded PDF
├── export.ts                 # CSV + PDF export helpers
├── prompts.ts                # All prompt templates as functions
types/
└── index.ts                  # All TypeScript interfaces
```

## Key Interfaces

```typescript
interface Analysis {
  title: string;
  summary: string;
  concepts: { name: string; description: string; difficulty: string; importance: string }[];
  estimatedStudyTime: string;
  topicAreas: string[];
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
  studyGuide: { sections: StudyGuideSection[] };
  flashcards: Flashcard[];
  quiz: { questions: QuizQuestion[] };
}

interface ReviewPack {
  weakAreaSummary: string;
  focusedFlashcards: Flashcard[];
  retakeQuiz: { questions: QuizQuestion[] };
  studyTips: string[];
}

interface QuizResult {
  round: number;
  score: number;
  totalQuestions: number;
  missedConcepts: string[];
  wrongAnswers: { questionId: string; concept: string; userAnswer: number; correctAnswer: number }[];
}
```

## Claude API Call Pattern

Every API route follows this pattern:

```typescript
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
    messages: [{ role: "user", content: promptText }],
  }),
});
const data = await response.json();
const text = data.content[0].text;
const parsed = JSON.parse(text);
```

Always include in prompts: "Respond ONLY with valid JSON. No markdown fences, no preamble, no explanation outside the JSON."

## Design Direction

- Clean, modern UI — not generic. Use a distinctive font pairing.
- Dark mode by default with accent color for interactive elements.
- Smooth transitions between screens (upload → analysis → materials → quiz → review).
- Skeleton loaders during API calls with contextual messages.
- Mobile responsive.

## Rules

- No database. No auth. This is a contest demo.
- Keep it simple. Don't over-engineer.
- Every flashcard and quiz question MUST include a `concept` field — this powers the adaptive loop.
- PDF text extraction happens server-side in API routes.
- Handle Claude API errors gracefully with retry logic and user-friendly messages.
- Truncate source text to ~60,000 characters if too long.
