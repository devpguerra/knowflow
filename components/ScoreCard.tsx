"use client";

import type { QuizResult, QuizQuestion } from "@/types";
import ProgressTracker from "@/components/ProgressTracker";

interface Props {
  result: QuizResult;
  questions: QuizQuestion[];
  allResults?: QuizResult[];
  onReview: () => void;
  onBack: () => void;
  reviewLoading: boolean;
}

export default function ScoreCard({ result, questions, allResults, onReview, onBack, reviewLoading }: Props) {
  const { score, totalQuestions, wrongAnswers, missedConcepts } = result;
  const pct = Math.round((score / totalQuestions) * 100);

  // SVG ring
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const dash = (pct / 100) * CIRC;

  // Build a map for quick question lookup
  const qMap = Object.fromEntries(questions.map((q) => [q.id, q]));

  // Group missed by concept
  const byConceptMap: Record<string, typeof wrongAnswers> = {};
  for (const wa of wrongAnswers) {
    (byConceptMap[wa.concept] ??= []).push(wa);
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up space-y-5">

      {/* Score ring */}
      <div
        className="rounded-xl p-8 flex flex-col items-center gap-3"
        style={{ background: "#110e09", border: "1px solid #2a2015" }}
      >
        <svg width="136" height="136" viewBox="0 0 136 136">
          {/* Track */}
          <circle cx="68" cy="68" r={R} fill="none" stroke="#2a2015" strokeWidth="10" />
          {/* Fill */}
          <circle
            cx="68"
            cy="68"
            r={R}
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
            transform="rotate(-90 68 68)"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          {/* Text */}
          <text x="68" y="62" textAnchor="middle" fill="#f0e8d8" fontSize="22" fontWeight="700" fontFamily="var(--font-heading)">
            {score}/{totalQuestions}
          </text>
          <text x="68" y="82" textAnchor="middle" fill="#d97706" fontSize="14" fontFamily="var(--font-body)">
            {pct}%
          </text>
        </svg>

        <p className="font-heading text-xl font-bold" style={{ color: "#f0e8d8" }}>
          {pct >= 80 ? "Great work!" : pct >= 50 ? "Good effort!" : "Keep practicing!"}
        </p>
        <p className="text-sm" style={{ color: "#8a7560" }}>
          Round {result.round} · {score} correct out of {totalQuestions} questions
        </p>
      </div>

      {/* Missed concepts */}
      {missedConcepts.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ background: "#110e09", border: "1px solid #2a2015" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#8a7560" }}>
            Concepts to Review
          </p>
          <div className="flex flex-wrap gap-2">
            {missedConcepts.map((c) => (
              <span
                key={c}
                className="px-3 py-1 rounded text-xs font-medium"
                style={{
                  background: "rgba(184,82,82,0.1)",
                  border: "1px solid rgba(184,82,82,0.28)",
                  color: "#e08080",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Wrong answer breakdown */}
      {wrongAnswers.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: "#8a7560" }}>
            Wrong Answers
          </p>
          {wrongAnswers.map((wa) => {
            const q = qMap[wa.questionId];
            if (!q) return null;
            return (
              <div
                key={wa.questionId}
                className="rounded-xl p-5 space-y-3"
                style={{ background: "#110e09", border: "1px solid #2a2015" }}
              >
                {/* Question */}
                <p className="text-sm font-medium leading-relaxed" style={{ color: "#f0e8d8" }}>
                  {q.question}
                </p>

                {/* User pick */}
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(184,82,82,0.18)", color: "#d46060" }}
                  >
                    ✗
                  </span>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "#8a7560" }}>Your answer</p>
                    <p className="text-sm" style={{ color: "#e08080" }}>
                      {wa.userAnswer === -1 ? "Not answered" : q.options[wa.userAnswer]}
                    </p>
                  </div>
                </div>

                {/* Correct */}
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(90,154,90,0.18)", color: "#6abf6a" }}
                  >
                    ✓
                  </span>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "#8a7560" }}>Correct answer</p>
                    <p className="text-sm" style={{ color: "#6abf6a" }}>{q.options[wa.correctAnswer]}</p>
                  </div>
                </div>

                {/* Explanation */}
                <div
                  className="rounded-lg px-4 py-3"
                  style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.18)" }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: "#d97706" }}>Explanation</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#fcd34d" }}>{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Perfect score */}
      {wrongAnswers.length === 0 && (
        <div
          className="rounded-xl p-6 text-center"
          style={{
            background: "rgba(90,154,90,0.05)",
            border: "1px solid rgba(90,154,90,0.22)",
          }}
        >
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-heading font-semibold" style={{ color: "#6abf6a" }}>Perfect score!</p>
          <p className="text-sm mt-1" style={{ color: "#8a7560" }}>You nailed every question.</p>
        </div>
      )}

      {/* Progress across rounds */}
      {allResults && allResults.length > 1 && (
        <ProgressTracker results={allResults} />
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        {missedConcepts.length > 0 && (
          <button
            onClick={onReview}
            disabled={reviewLoading}
            className="flex-1 py-3 rounded-xl font-heading font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
            style={
              reviewLoading
                ? { background: "rgba(217,119,6,0.3)", color: "rgba(255,255,255,0.4)", cursor: "not-allowed" }
                : {
                    background: "#d97706",
                    color: "#fff",
                    boxShadow: "0 0 20px rgba(217,119,6,0.35)",
                  }
            }
          >
            {reviewLoading ? <SmallSpinner /> : <SparkleIcon />}
            Generate Review Pack
          </button>
        )}

        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl font-heading font-semibold text-sm transition-all duration-200"
          style={{ background: "#110e09", border: "1px solid #2a2015", color: "#f0e8d8" }}
        >
          ← Back to Materials
        </button>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.88 5.76a1 1 0 00.95.69H21l-4.94 3.59a1 1 0 00-.36 1.12L17.56 20 12 16.31 6.44 20l1.86-5.84a1 1 0 00-.36-1.12L3 9.45h6.17a1 1 0 00.95-.69L12 3z" />
    </svg>
  );
}

function SmallSpinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeOpacity="0.3" />
      <path d="M12 2v4" />
    </svg>
  );
}
