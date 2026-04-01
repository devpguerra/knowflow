# Building Knowledge Transformer with Claude Code — Step by Step

## Before You Start

1. Make sure Claude Code is installed and working
2. Have your Anthropic API key ready
3. Create a new folder for the project

```bash
mkdir knowledge-transformer
cd knowledge-transformer
```

4. Drop the CLAUDE.md file (provided separately) into this folder
5. Open Claude Code in this directory

---

## Step 1: Project Scaffold

Paste this into Claude Code:

```
Set up a new Next.js 14 project here with TypeScript and Tailwind CSS.
Install these dependencies: pdf-parse, jspdf, @types/pdf-parse.
Create a .env.local file with ANTHROPIC_API_KEY placeholder.
Then create all the files and folders described in CLAUDE.md but leave
the implementations empty (just basic exports/placeholders).
Also create the types/index.ts file with all the interfaces from CLAUDE.md.
```

**What to check:** You should have a running Next.js app with the full file structure. Run `npm run dev` to verify.

---

## Step 2: Claude API Wrapper + Prompts

```
Create lib/claude.ts — a helper function that calls the Claude API
using the pattern in CLAUDE.md. It should:
- Accept a prompt string
- Call claude-sonnet-4-20250514
- Parse the JSON response
- Include retry logic (1 retry on failure)
- Throw a clear error if JSON parsing fails

Then create lib/prompts.ts with three prompt-building functions:
1. buildAnalyzePrompt(text: string, difficulty: string) — returns a prompt
   that asks Claude to analyze the text and return an Analysis JSON object
2. buildGeneratePrompt(text: string, analysis: Analysis, difficulty: string) —
   returns a prompt that asks for study guide + flashcards + quiz as
   GeneratedMaterials JSON. Ask for 10-15 flashcards and 8-10 quiz questions.
3. buildReviewPrompt(sourceText: string, wrongAnswers: array, missedConcepts: array) —
   returns a prompt that generates a ReviewPack JSON focused on weak areas.

All prompts must end with: "Respond ONLY with valid JSON. No markdown
fences, no preamble."
```

**What to check:** Read through the prompts — they're the heart of the agent. Make sure they're specific about the JSON structure expected.

---

## Step 3: API Routes

```
Create the three main API routes:

1. app/api/analyze/route.ts
   - POST handler
   - Accepts { text: string, difficulty: string }
   - If the request includes a PDF file, extract text using pdf-parse
   - Truncate text to 60000 chars if needed
   - Calls Claude via the wrapper with buildAnalyzePrompt
   - Returns the Analysis JSON

2. app/api/generate/route.ts
   - POST handler
   - Accepts { text: string, analysis: Analysis, difficulty: string }
   - Calls Claude with buildGeneratePrompt
   - Returns GeneratedMaterials JSON

3. app/api/review/route.ts
   - POST handler
   - Accepts { sourceText: string, wrongAnswers: array, missedConcepts: array }
   - Calls Claude with buildReviewPrompt
   - Returns ReviewPack JSON

All routes should have try/catch with proper error responses.
```

**What to check:** Test each route with curl or Thunder Client before building the frontend. Example:

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Photosynthesis is the process by which plants convert sunlight into energy...", "difficulty": "beginner"}'
```

---

## Step 4: Landing Page (Upload Screen)

```
Build the landing page (app/page.tsx) with:
- A centered layout with the app title "Knowledge Transformer" and
  a one-line subtitle
- A tab toggle: "Paste Text" | "Upload PDF"
  - Paste Text: a large textarea
  - Upload PDF: a drag-and-drop zone that accepts .pdf files
- A difficulty selector: three buttons (Beginner / Intermediate / Advanced)
  that toggle, default to Intermediate
- A "Transform" button that:
  1. Sends the text (or PDF) + difficulty to /api/analyze
  2. Shows a loading state with a message like "Analyzing your content..."
  3. On success, stores the analysis and source text in state
  4. Then automatically calls /api/generate
  5. Shows "Generating study materials..."
  6. On success, navigates to the materials view

Use React context or a simple state management approach to share
data between pages. Store everything in a context provider in layout.tsx.

Follow the design direction in CLAUDE.md — make it visually distinctive.
```

**What to check:** Upload a PDF or paste text, hit Transform, and verify you see loading states and eventually get redirected.

---

## Step 5: Materials Viewer

```
Build the materials viewer page (app/materials/page.tsx) with three tabs:

1. Study Guide tab — renders the study guide sections.
   Each section has a title, markdown content, and key takeaways.
   Make it readable with good typography.

2. Flashcards tab — an interactive flashcard deck.
   Show one card at a time. Click to flip (front/back).
   Arrow buttons or swipe to go prev/next.
   Show progress like "Card 3 of 15".
   Each card should subtly show which concept it covers.

3. Quiz tab — just a "Start Quiz" button that navigates to the quiz page.

Also add:
- A sidebar or header showing the content analysis summary
  (title, concept count, estimated study time)
- An "Export" dropdown with "Flashcards as CSV" and "Study Guide as PDF"

For CSV export, convert flashcards to a CSV string and trigger download.
For PDF export, use jspdf to create a simple document from the study guide.
```

---

## Step 6: Interactive Quiz

```
Build the quiz page (app/quiz/page.tsx) with the QuizRunner component:

- Show one question at a time with the 4 answer options as clickable cards
- Highlight selected answer
- "Next" button to advance (disabled until an answer is selected)
- On the last question, button says "Submit Quiz"
- After submit, show the ScoreCard:
  - Overall score (e.g., "7/10 — 70%")
  - Per-concept breakdown showing which concepts were missed
  - For each wrong answer: show the question, what the user picked,
    the correct answer, and the explanation
  - Two buttons at the bottom:
    1. "Generate Review Pack" — calls /api/review with the wrong
       answers and missed concepts, then navigates to review page
    2. "Back to Materials" — returns to materials viewer

Store the quiz result in the app context and in localStorage
for progress tracking.
```

---

## Step 7: Adaptive Review (THE KEY FEATURE)

```
Build the review page (app/review/page.tsx):

- Shows a "Weak Area Summary" section from the review pack
- Shows "Study Tips" as a callout/card
- Shows focused flashcards (same FlashcardDeck component, reused)
- Has a "Retake Quiz" button that starts a new quiz using the
  retakeQuiz questions from the review pack
- When retake is completed, the score is added to progress history

Also build the ProgressTracker component:
- Shows all quiz rounds with scores
- Simple visual: could be a series of bars or a line
- Example display: "Round 1: 60% → Round 2: 85% → Round 3: 100%"
- Show this on both the review page and the score card
```

---

## Step 8: Polish

```
Polish the app:

1. Add a smooth loading experience:
   - Skeleton loaders while waiting for API responses
   - Contextual loading messages that rotate:
     "Identifying key concepts..."
     "Building flashcards..."
     "Crafting quiz questions..."

2. Add transitions between pages/screens (fade or slide)

3. Make sure the app is responsive on mobile

4. Add an empty state for the materials page if someone
   navigates there directly without data

5. Add error handling UI: if an API call fails, show a
   friendly message with a retry button

6. Make the flashcard flip animation smooth (CSS transform rotateY)
```

---

## Testing Your Demo

Once built, test this exact flow:

1. Paste a meaty chunk of text (grab a Wikipedia article or a technical doc)
2. Select "Intermediate" difficulty
3. Hit Transform → verify analysis + materials generate
4. Browse study guide and flashcards
5. Take the quiz — intentionally miss 2-3 questions
6. Click "Generate Review Pack"
7. Review the focused materials
8. Retake the quiz
9. Verify progress tracker shows improvement
10. Export flashcards as CSV, study guide as PDF

If all 10 steps work, you're demo-ready.

---

## Common Issues & Fixes

**Claude returns markdown fences around JSON:**
Add JSON stripping in lib/claude.ts:
```typescript
const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
```

**PDF upload doesn't work:**
Make sure pdf-parse is imported only in server-side code (API routes),
not in client components. Use FormData to send the file from the client.

**Response too slow:**
Consider streaming responses for better UX, or just use good loading states.
Sonnet is fast enough that 10-15 second waits are normal for complex generation.

**JSON parsing fails:**
Your retry logic should handle this. If it keeps failing, the prompt might
need tweaking — ask Claude Code to adjust the prompt to be more explicit
about the JSON structure.
