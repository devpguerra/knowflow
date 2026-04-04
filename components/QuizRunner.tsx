"use client";

import { useState } from "react";
import type { QuizQuestion, QuizResult } from "@/types";

interface Props {
  questions: QuizQuestion[];
  round: number;
  onComplete: (result: QuizResult) => void;
}

export default function QuizRunner({ questions, round, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  // questionId → chosen option index
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const progress = ((index + (selected !== null ? 0.5 : 0)) / questions.length) * 100;

  function advance() {
    if (selected === null) return;

    const nextAnswers = { ...answers, [question.id]: selected };

    if (isLast) {
      // Compute result
      const wrongAnswers: QuizResult["wrongAnswers"] = [];
      const missedConceptsSet = new Set<string>();

      for (const q of questions) {
        const chosen = nextAnswers[q.id] ?? -1;
        if (chosen !== q.correctAnswer) {
          wrongAnswers.push({
            questionId: q.id,
            concept: q.concept,
            question: q.question,
            userAnswer: chosen,
            correctAnswer: q.correctAnswer,
          });
          missedConceptsSet.add(q.concept);
        }
      }

      onComplete({
        round,
        score: questions.length - wrongAnswers.length,
        totalQuestions: questions.length,
        missedConcepts: Array.from(missedConceptsSet),
        wrongAnswers,
      });
    } else {
      setAnswers(nextAnswers);
      setIndex((i) => i + 1);
      setSelected(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-2" style={{ color: "#7070a0" }}>
          <span>Question {index + 1} of {questions.length}</span>
          <span style={{ color: "#8b5cf6" }}>{question.concept}</span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: "#1e1e36" }}>
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #8b5cf6, #7c3aed)" }}
          />
        </div>
      </div>

      {/* Question card */}
      <div
        className="rounded-xl p-7 mb-5"
        style={{ background: "#0e0e1a", border: "1px solid #1e1e36" }}
      >
        <p className="font-heading text-lg font-semibold leading-snug" style={{ color: "#e8e8f8" }}>
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all duration-150"
              style={
                isSelected
                  ? {
                      background: "rgba(139,92,246,0.12)",
                      border: "1px solid rgba(139,92,246,0.65)",
                      boxShadow: "0 0 16px rgba(139,92,246,0.15)",
                    }
                  : {
                      background: "#0e0e1a",
                      border: "1px solid #1e1e36",
                    }
              }
            >
              {/* Option letter */}
              <span
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-xs font-bold"
                style={
                  isSelected
                    ? { background: "#8b5cf6", color: "#fff" }
                    : { background: "#1e1e36", color: "#7070a0" }
                }
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm leading-relaxed" style={{ color: isSelected ? "#e8e8f8" : "#94a3b8" }}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Next / Submit */}
      <button
        onClick={advance}
        disabled={selected === null}
        className="w-full py-3.5 rounded-xl font-heading font-semibold text-base transition-all duration-200"
        style={
          selected !== null
            ? {
                background: "#8b5cf6",
                color: "#fff",
                boxShadow: "0 0 20px rgba(139,92,246,0.4)",
              }
            : { background: "#0e0e1a", border: "1px solid #1e1e36", color: "#7070a0", cursor: "not-allowed" }
        }
      >
        {isLast ? "Submit Quiz" : "Next →"}
      </button>
    </div>
  );
}
