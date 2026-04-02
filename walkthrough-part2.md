# Upgrading to Agent Architecture — Walkthrough (Part 2)

You've already built the full workflow app (Steps 1-8). Everything works:
upload → analyze → generate → quiz → review. Now we're upgrading it from
a fixed pipeline into a real agent with tool use, parallel execution,
and visible reasoning.

---

## Step 9: Define Agent Tools

```
Create a new file lib/tools.ts that exports an agentTools array.
These are Claude tool-use definitions (following the Anthropic tool use format)
for the following tools:

1. analyze_content — analyzes source material, returns concepts/structure/difficulty
2. web_search — searches for supplementary info when source material has gaps
3. generate_flashcards — generates flashcards for given concepts
4. generate_quiz — generates quiz questions (multiple_choice and true_false types)
5. generate_study_guide — generates narrative study guide sections
6. assess_knowledge_gaps — analyzes quiz results to diagnose weak areas

Each tool should have a name, description, and input_schema with
typed properties. The descriptions are important — they tell Claude
WHEN to use each tool. For example, generate_flashcards description
should say "Best for material with terminology, definitions, or factual
content that benefits from active recall practice."

Use the exact interfaces from types/index.ts for the expected outputs.
Reference CLAUDE.md for the full tool definitions.
```

**Verify:** Read through the descriptions. They should be specific enough that Claude can reason about *when* each tool is appropriate.

---

## Step 10: Tool Executor with Parallel Support

```
Create lib/toolExecutor.ts — this is the engine that runs tool calls.

It should export a function executeToolCalls that:
1. Accepts an array of tool_use blocks (from Claude's response)
2. Splits them into two groups:
   - PARALLEL_SAFE: generate_flashcards, generate_quiz, generate_study_guide
   - SEQUENTIAL: analyze_content, web_search, assess_knowledge_gaps
3. Runs all PARALLEL_SAFE tools simultaneously with Promise.all
4. Runs SEQUENTIAL tools one at a time
5. Returns a map of { toolName: { result, durationMs } }

Each tool execution is a separate Claude API call using the existing
callClaude function from lib/claude.ts. Each call sends a focused prompt
asking Claude to produce the specific output for that tool.

For example, when executing generate_flashcards, it calls Claude with:
"Given these concepts: [concepts from tool input], generate [count]
flashcards at [difficulty] level. Each flashcard must have: id, front,
back, concept, difficulty. Respond ONLY with valid JSON array."

For web_search: since we don't have a real search API wired up,
simulate it by calling Claude and asking it to generate supplementary
context about the query topic based on its training knowledge.
Add a comment marking this as a spot to plug in real search later.

Log the duration of each tool call so we can display parallel execution
to the user. Something like:
console.log(`[${toolName}] completed in ${durationMs}ms`);
```

**Verify:** The key thing to check is that Promise.all is used for the parallel group. Add a temporary test in the file that calls three tools and logs their durations — you should see them complete in roughly the same wall-clock time, not sequentially.

---

## Step 11: Upgrade API Routes to Agent Orchestration

```
Replace the existing /api/analyze, /api/generate, and /api/review routes
with two new agent routes. You can delete the old ones.

1. app/api/agent/route.ts — Main agent orchestrator
   - POST handler accepting { text: string, difficulty: string }
   - Handles PDF text extraction if needed (move that logic here)
   - Truncates text to 60000 chars
   - Sends Claude the system prompt (from CLAUDE.md "Main Agent" section),
     the user's text as the user message, and the agentTools array
   - Processes Claude's response in a loop:
     a. If Claude returns text blocks, capture them as agent reasoning
     b. If Claude returns tool_use blocks, execute them via toolExecutor
     c. Send tool results back to Claude as tool_result messages
     d. Repeat until Claude responds with only text (no more tool calls)
   - Collects all generated materials from tool results
   - Returns to frontend: { materials, agentReasoning, toolTimings }

2. app/api/agent/review/route.ts — Review agent orchestrator
   - POST handler accepting { sourceText, quizResult }
   - Same loop pattern as above but uses the Review Agent system prompt
   - Claude will call assess_knowledge_gaps first, then decide which
     generation tools to call based on the score
   - Returns: { reviewPack, agentReasoning, toolTimings }

Keep /api/export/route.ts as is — it doesn't need agent behavior.

The agent loop pattern looks like this:

let messages = [{ role: "user", content: userInput }];
let allReasoning = [];
let allResults = {};

while (true) {
  const response = await callClaudeWithTools(systemPrompt, messages, agentTools);

  // Capture any text blocks as reasoning
  const textBlocks = response.content.filter(b => b.type === "text");
  allReasoning.push(...textBlocks.map(b => b.text));

  // Check for tool calls
  const toolCalls = response.content.filter(b => b.type === "tool_use");
  if (toolCalls.length === 0) break; // Agent is done

  // Execute tools (parallel when safe)
  const results = await executeToolCalls(toolCalls);
  Object.assign(allResults, results);

  // Send results back to Claude for next decision
  messages.push({ role: "assistant", content: response.content });
  messages.push({
    role: "user",
    content: toolCalls.map(tc => ({
      type: "tool_result",
      tool_use_id: tc.id,
      content: JSON.stringify(results[tc.name].result)
    }))
  });
}
```

**Verify:** Test with curl. Send a text payload and check that:
- The response includes agentReasoning (Claude's thinking)
- Materials are generated (some combination of flashcards/quiz/guide)
- toolTimings show parallel tools ran in similar time

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"text": "Machine learning is a subset of artificial intelligence that enables systems to learn from data... [paste a longer text here]", "difficulty": "intermediate"}'
```

---

## Step 12: Agent Reasoning Component

```
Create components/AgentReasoning.tsx — a collapsible panel that shows
what the agent is thinking and doing.

It should:
- Accept an array of reasoning strings and tool timings
- Show each reasoning step as a chat-like bubble or log entry
- Show which tools were called with their execution times
- For parallel tools, visually indicate they ran simultaneously
  (e.g., show them side by side or with a "parallel" badge)
- Have a subtle "thinking" animation (pulsing dot or typing indicator)
  while the agent is working
- Be collapsible — expanded by default on first load, then the user
  can minimize it
- Use a monospace or slightly different font to distinguish it from
  the main content

Example display:
┌─────────────────────────────────────────┐
│ 🤖 Agent Reasoning                  ▼  │
├─────────────────────────────────────────┤
│ "I found 8 key concepts in this text.   │
│  Heavy on terminology with some process │
│  flows. I'll generate flashcards for    │
│  the terms and a study guide for the    │
│  processes."                            │
│                                         │
│ ⚡ Running in parallel:                 │
│  ✓ generate_flashcards  — 3.2s          │
│  ✓ generate_quiz        — 4.1s          │
│  ✓ generate_study_guide — 3.8s          │
│  Total wall time: 4.1s (saved ~7s)      │
└─────────────────────────────────────────┘
```

**Verify:** The reasoning panel should appear on the materials page after generation completes.

---

## Step 13: Update Frontend to Use Agent Routes

```
Update the frontend to use the new agent API routes instead of the
old analyze + generate routes.

1. app/page.tsx (Landing page):
   - Instead of calling /api/analyze then /api/generate separately,
     make a single call to /api/agent
   - The loading state should now show the agent's progress:
     "Agent is analyzing your content..."
     "Agent is searching for supplementary info..." (if it decides to)
     "Agent is generating materials in parallel..."
   - Store the returned agentReasoning and toolTimings in context
     alongside the materials

2. app/materials/page.tsx (Materials viewer):
   - Add the AgentReasoning component at the top of the page
   - Materials tabs should now handle null values — if the agent
     decided not to generate a study guide (e.g., for pure terminology
     content), that tab shouldn't appear
   - Update the tab logic: only show tabs for materials that exist

3. app/review/page.tsx (Review page):
   - Instead of calling /api/review, call /api/agent/review
   - Show the review agent's reasoning (it should explain WHY it
     chose a particular review strategy)
   - The review pack may now contain different combinations of materials
     depending on the score — handle null flashcards, null quiz, etc.

4. Update the AppContext to include:
   - agentReasoning: string[]
   - toolTimings: { toolName: string, durationMs: number }[]
```

**Verify:** Full flow test. Paste text → agent analyzes and reasons → generates materials (check that some tabs might not appear depending on content) → quiz → review agent reasons about gaps → generates review pack.

---

## Step 14: Loading States for Agent Actions

```
Create components/LoadingAgent.tsx — a rich loading component that
shows what the agent is currently doing.

It should:
- Accept a "phase" prop: "analyzing" | "searching" | "generating" | "reviewing"
- Show an animated indicator (not a boring spinner — something that
  feels like an AI is thinking)
- Display contextual messages based on the phase:
  analyzing: "Reading through your content...", "Mapping out key concepts..."
  searching: "Looking for supplementary context...", "Found something useful..."
  generating: "Building your flashcards...", "Crafting quiz questions...",
              "Writing study guide..." (these three rotate simultaneously
              if parallel)
  reviewing: "Analyzing your quiz results...", "Identifying knowledge gaps...",
             "Designing your review strategy..."
- For the "generating" phase, show three parallel progress bars or
  indicators that fill independently to visualize parallel execution

Replace all existing loading states (skeleton loaders, spinners) in
the landing page and review page with this component.
```

**Verify:** The loading experience should feel like watching an agent work, not just waiting for a response.

---

## Step 15: Final Polish + Demo Readiness

```
Final round of polish:

1. Agent reasoning should also appear briefly on the score card after
   a quiz — when the user clicks "Generate Review Pack", show a small
   note like "The review agent will analyze your results and create
   a personalized study plan."

2. Add a "topic mode" to the landing page: a text input where the user
   can type just a topic (like "Kubernetes basics") without uploading
   anything. The agent should detect there's no source material and
   use web_search to gather context before generating materials.
   Add a third tab to the input: "Paste Text" | "Upload PDF" | "Just a Topic"

3. Progress tracker should now also show which round used the
   adaptive review. Example:
   "Round 1: 60% → 🤖 Review Agent: focused on 3 weak concepts → Round 2: 90%"

4. Make sure exports still work with the new data structure.

5. Verify error handling — if the agent loop fails midway, the user
   should see a friendly error with what went wrong and a retry button.

6. Prepare for Vercel deployment:
   - Make sure no API routes use Node.js features incompatible with
     Vercel serverless
   - Add export const maxDuration = 60; to both agent routes
     (the agent loop may take longer than default timeout)
   - Test that .env.local is in .gitignore
```

---

## Testing the Full Agent Flow

Test these scenarios to make sure the agent makes different decisions:

**Scenario 1: Terminology-heavy text**
Paste a glossary or technical spec with lots of definitions.
Expected: Agent should prioritize flashcards, possibly skip or shorten study guide.

**Scenario 2: Conceptual/process text**
Paste something about a workflow or methodology (e.g., Agile, scientific method).
Expected: Agent should prioritize study guide, still generate quiz.

**Scenario 3: Topic-only input**
Type "Docker containerization basics" with no source material.
Expected: Agent should call web_search first, then generate materials.

**Scenario 4: High quiz score (>80%)**
Take quiz and get most right.
Expected: Review agent should do light review — just a few focused flashcards.

**Scenario 5: Low quiz score (<50%)**
Take quiz and fail badly.
Expected: Review agent should do deep review — simplified guide + easier quiz.

If all 5 scenarios produce visibly different agent behavior, you have
a real agent that judges will be impressed by.

---

## Demo Script (Updated for Agent Architecture)

1. **Open the app** — "This is Knowledge Transformer — an AI agent that
   turns any knowledge source into a personalized learning system."

2. **Paste technical content** — Use something with mixed terminology and concepts

3. **Watch the agent reason** — Point out the reasoning panel:
   "The agent identified 10 concepts — mostly terminology with some
   process flows. It decided to prioritize flashcards and also
   generate a study guide for the processes."

4. **Highlight parallel execution** — "Notice it generated all three
   material types in parallel — 4 seconds instead of 12."

5. **Browse materials** — Show that tabs match what the agent decided

6. **Take the quiz** — Miss a few intentionally

7. **Watch the review agent** — "Now a review agent analyzes my gaps.
   I scored 60%, so it's doing a moderate review — flashcards for
   the terms I missed plus a simplified study section."

8. **Show the adaptive materials** — They should be clearly focused

9. **Retake and improve** — "70% → 95% in two rounds."

10. **Topic-only mode** — Type "Kubernetes basics" with no file.
    "I don't even need a document — the agent searches for context
    and builds materials from scratch."

**Closing:** "It analyzes, decides, generates in parallel, tests, adapts.
That's not a chatbot — that's an agent."
