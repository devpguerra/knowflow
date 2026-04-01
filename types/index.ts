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
  options: string[];
  correctAnswer: number;
  explanation: string;
  concept: string;
}

export interface StudyGuideSection {
  title: string;
  content: string;
  keyTakeaways: string[];
}

export interface GeneratedMaterials {
  studyGuide: { sections: StudyGuideSection[] };
  flashcards: Flashcard[];
  quiz: { questions: QuizQuestion[] };
}

export interface ReviewPack {
  weakAreaSummary: string;
  focusedFlashcards: Flashcard[];
  retakeQuiz: { questions: QuizQuestion[] };
  studyTips: string[];
}

export interface QuizResult {
  round: number;
  score: number;
  totalQuestions: number;
  missedConcepts: string[];
  wrongAnswers: {
    questionId: string;
    concept: string;
    userAnswer: number;
    correctAnswer: number;
  }[];
}
