"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Analysis, GeneratedMaterials, QuizResult, AgentEvent } from "@/types";

interface AppState {
  sourceText: string;
  setSourceText: (t: string) => void;
  difficulty: string;
  setDifficulty: (d: string) => void;
  analysis: Analysis | null;
  setAnalysis: (a: Analysis | null) => void;
  materials: GeneratedMaterials | null;
  setMaterials: (m: GeneratedMaterials | null) => void;
  agentEvents: AgentEvent[];
  appendAgentEvents: (events: AgentEvent[]) => void;
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
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

  function appendAgentEvents(events: AgentEvent[]) {
    setAgentEvents((prev) => [...prev, ...events]);
  }

  function addQuizResult(r: QuizResult) {
    setQuizResults((prev) => [...prev, r]);
  }

  function resetSession() {
    setSourceText("");
    setDifficulty("intermediate");
    setAnalysis(null);
    setMaterials(null);
    setAgentEvents([]);
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
        agentEvents,
        appendAgentEvents,
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
