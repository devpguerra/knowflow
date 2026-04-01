"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Analysis, GeneratedMaterials, QuizResult } from "@/types";

interface AppState {
  sourceText: string;
  setSourceText: (t: string) => void;
  difficulty: string;
  setDifficulty: (d: string) => void;
  analysis: Analysis | null;
  setAnalysis: (a: Analysis | null) => void;
  materials: GeneratedMaterials | null;
  setMaterials: (m: GeneratedMaterials | null) => void;
  quizResults: QuizResult[];
  addQuizResult: (r: QuizResult) => void;
  resetSession: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sourceText, setSourceText] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [materials, setMaterials] = useState<GeneratedMaterials | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

  function addQuizResult(r: QuizResult) {
    setQuizResults((prev) => [...prev, r]);
  }

  function resetSession() {
    setSourceText("");
    setDifficulty("intermediate");
    setAnalysis(null);
    setMaterials(null);
    setQuizResults([]);
  }

  return (
    <AppContext.Provider
      value={{
        sourceText,
        setSourceText,
        difficulty,
        setDifficulty,
        analysis,
        setAnalysis,
        materials,
        setMaterials,
        quizResults,
        addQuizResult,
        resetSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
