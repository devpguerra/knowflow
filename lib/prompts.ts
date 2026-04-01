import type { Analysis, QuizResult } from "@/types";

const JSON_ONLY = "Respond ONLY with valid JSON. No markdown fences, no preamble.";

export function buildAnalyzePrompt(text: string, difficulty: string): string {
  return `You are an expert educator. Analyze the following study material and extract structured information about it.

Difficulty level requested by the user: ${difficulty}

Source text:
"""
${text}
"""

Return a JSON object with this exact shape:
{
  "title": "string — inferred title or topic",
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

export function buildGeneratePrompt(
  text: string,
  analysis: Analysis,
  difficulty: string
): string {
  return `You are an expert educator. Using the source material and its analysis, generate comprehensive study materials.

Difficulty level: ${difficulty}
Topic: ${analysis.title}
Key concepts: ${analysis.concepts.map((c) => c.name).join(", ")}

Source text:
"""
${text}
"""

Return a JSON object with this exact shape:
{
  "studyGuide": {
    "sections": [
      {
        "title": "string",
        "content": "string — detailed explanation (2-4 paragraphs)",
        "keyTakeaways": ["string"]
      }
    ]
  },
  "flashcards": [
    {
      "id": "string — unique e.g. 'fc-1'",
      "front": "string — question or term",
      "back": "string — answer or definition",
      "concept": "string — which concept this belongs to",
      "difficulty": "easy | medium | hard"
    }
  ],
  "quiz": {
    "questions": [
      {
        "id": "string — unique e.g. 'q-1'",
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswer": 0,
        "explanation": "string — why this answer is correct",
        "concept": "string — which concept this tests"
      }
    ]
  }
}

Generate at least 6 flashcards and 5 quiz questions. correctAnswer is the zero-based index of the correct option.

${JSON_ONLY}`;
}

export function buildReviewPrompt(
  sourceText: string,
  wrongAnswers: QuizResult["wrongAnswers"],
  missedConcepts: string[]
): string {
  const wrongSummary = wrongAnswers
    .map((w) => `- Concept: "${w.concept}" (question id: ${w.questionId})`)
    .join("\n");

  return `You are an expert educator. A student just completed a quiz and needs targeted review material for their weak areas.

Missed concepts:
${missedConcepts.map((c) => `- ${c}`).join("\n")}

Wrong answers breakdown:
${wrongSummary}

Original source text (for context):
"""
${sourceText}
"""

Return a JSON object with this exact shape:
{
  "weakAreaSummary": "string — 2-3 sentences explaining the gaps and what to focus on",
  "focusedFlashcards": [
    {
      "id": "string — unique e.g. 'rfc-1'",
      "front": "string",
      "back": "string",
      "concept": "string",
      "difficulty": "easy | medium | hard"
    }
  ],
  "retakeQuiz": {
    "questions": [
      {
        "id": "string — unique e.g. 'rq-1'",
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswer": 0,
        "explanation": "string",
        "concept": "string"
      }
    ]
  },
  "studyTips": ["string"]
}

Generate at least 4 focused flashcards and 4 quiz questions targeting only the missed concepts. correctAnswer is the zero-based index of the correct option.

${JSON_ONLY}`;
}
