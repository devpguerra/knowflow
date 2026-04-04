export interface Analysis {
  title: string;
  summary: string;
  concepts: {
    name: string;
    description: string;
    difficulty: string;
    importance: string;
  }[];
  estimatedStudyTime: string;
  topicAreas: string[];
}

export interface AgentReasoning {
  thought: string;
  decision: string;
  toolsCalled: string[];
  rationale: string;
}

export interface KnowledgeGapAssessment {
  weakConcepts: { name: string; severity: "low" | "medium" | "high" }[];
  strategy: string;
  recommendedActions: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  concept: string;
  difficulty: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type?: "multiple_choice" | "true_false";
  options: string[];
  correctAnswer: number;
  explanation: string;
  concept: string;
}

export interface StudyGuideSection {
  title: string;
  content: string;
  keyTakeaways: string[];
  sources?: { title: string; url: string }[];
}

export interface GeneratedMaterials {
  studyGuide: { sections: StudyGuideSection[] } | null;
  flashcards: Flashcard[] | null;
  quiz: { questions: QuizQuestion[] } | null;
  agentReasoning?: AgentReasoning;
}

export interface ReviewPack {
  assessment: KnowledgeGapAssessment;
  focusedFlashcards: Flashcard[] | null;
  retakeQuiz: { questions: QuizQuestion[] } | null;
  simplifiedGuide?: { sections: StudyGuideSection[] } | null;
  agentReasoning?: AgentReasoning;
}

export interface ToolTiming {
  toolName: string;
  durationMs: number;
}

export type AgentEvent =
  | { type: "reasoning"; text: string }
  | { type: "tool_call"; tools: { toolName: string; durationMs: number }[]; parallel: boolean };

export interface QuizResult {
  round: number;
  score: number;
  totalQuestions: number;
  missedConcepts: string[];
  wrongAnswers: {
    questionId: string;
    concept: string;
    question: string;
    userAnswer: number;
    correctAnswer: number;
  }[];
}
