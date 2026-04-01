import type { Analysis, GeneratedMaterials, ReviewPack } from "@/types";

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

const MOCK_GENERATED_MATERIALS: GeneratedMaterials = {
  studyGuide: {
    sections: [
      {
        title: "Photosynthesis",
        content:
          "Photosynthesis converts light energy into chemical energy stored as glucose. It occurs in the chloroplasts of plant cells and requires sunlight, CO2, and water. The overall equation is: 6CO2 + 6H2O + light → C6H12O6 + 6O2.",
        keyTakeaways: [
          "Occurs in chloroplasts",
          "Requires sunlight, CO2, and water",
          "Produces glucose and oxygen",
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
      },
    ],
  },
  flashcards: [
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
  ],
  quiz: {
    questions: [
      {
        id: "q-1",
        question: "Where does photosynthesis occur?",
        options: ["Mitochondria", "Chloroplast", "Nucleus", "Ribosome"],
        correctAnswer: 1,
        explanation: "Photosynthesis takes place in the chloroplasts, which contain chlorophyll.",
        concept: "Photosynthesis",
      },
      {
        id: "q-2",
        question: "What molecule is considered the 'energy currency' of the cell?",
        options: ["DNA", "Glucose", "ATP", "NADPH"],
        correctAnswer: 2,
        explanation:
          "ATP (Adenosine Triphosphate) stores and transfers energy within cells.",
        concept: "ATP Production",
      },
      {
        id: "q-3",
        question: "Which gas is released as a byproduct of photosynthesis?",
        options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"],
        correctAnswer: 2,
        explanation: "Oxygen is released when water molecules are split during the light reactions.",
        concept: "Photosynthesis",
      },
    ],
  },
};

const MOCK_REVIEW_PACK: ReviewPack = {
  weakAreaSummary:
    "You struggled with questions about the ATP cycle and the light reactions. Focus on understanding how energy is captured and transferred in these processes.",
  focusedFlashcards: [
    {
      id: "rfc-1",
      front: "What drives the light reactions?",
      back: "Sunlight absorbed by chlorophyll.",
      concept: "Light Reactions",
      difficulty: "medium",
    },
    {
      id: "rfc-2",
      front: "How many ATP does one glucose yield?",
      back: "Approximately 30–32 ATP through aerobic respiration.",
      concept: "ATP Production",
      difficulty: "hard",
    },
  ],
  retakeQuiz: {
    questions: [
      {
        id: "rq-1",
        question: "What is produced in the light reactions?",
        options: ["Glucose", "ATP", "CO2", "Water"],
        correctAnswer: 1,
        explanation:
          "The light reactions produce ATP and NADPH, which power the Calvin cycle.",
        concept: "Light Reactions",
      },
      {
        id: "rq-2",
        question: "What is the role of NADPH in photosynthesis?",
        options: [
          "Absorbs light energy",
          "Carries electrons to the Calvin cycle",
          "Splits water molecules",
          "Produces oxygen",
        ],
        correctAnswer: 1,
        explanation: "NADPH carries high-energy electrons from the light reactions to the Calvin cycle.",
        concept: "Light Reactions",
      },
    ],
  },
  studyTips: [
    "Draw a diagram of the ATP cycle to visualize energy transfer.",
    "Trace the path of a single electron through the light reactions.",
    "Compare and contrast the light reactions vs. the Calvin cycle side by side.",
  ],
};

// Drop-in replacement for the real Claude API call.
// To go live: replace the body of this function with a real fetch to
// claude-sonnet-4-20250514, add 1 retry on failure, and throw a clear
// error if JSON parsing fails.
export async function callClaude(prompt: string): Promise<unknown> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const lower = prompt.toLowerCase();

  if (lower.includes("analyze")) {
    return MOCK_ANALYSIS;
  }

  if (lower.includes("generate")) {
    return MOCK_GENERATED_MATERIALS;
  }

  if (lower.includes("review")) {
    return MOCK_REVIEW_PACK;
  }

  throw new Error(
    `callClaude: could not determine response type from prompt. ` +
      `Prompt must include "analyze", "generate", or "review".`
  );
}
