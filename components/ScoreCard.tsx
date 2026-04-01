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
        className="rounded-2xl p-8 flex flex-col items-center gap-3"
        style={{ background: "#10101c", border: "1px solid #1e1e38" }}
      >
        <svg width="136" height="136" viewBox="0 0 136 136">
          {/* Track */}
          <circle cx="68" cy="68" r={R} fill="none" stroke="#1e1e38" strokeWidth="10" />
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
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          {/* Text */}
          <text x="68" y="62" textAnchor="middle" fill="#e8e8f0" fontSize="22" fontWeight="700" fontFamily="var(--font-heading)">
            {score}/{totalQuestions}
          </text>
          <text x="68" y="82" textAnchor="middle" fill="#a78bfa" fontSize="14" fontFamily="var(--font-body)">
            {pct}%
          </text>
        </svg>

        <p className="font-heading text-xl font-bold" style={{ color: "#e8e8f0" }}>
          {pct >= 80 ? "Great work!" : pct >= 50 ? "Good effort!" : "Keep practicing!"}
        </p>
        <p className="text-sm" style={{ color: "#8888aa" }}>
          Round {result.round} · {score} correct out of {totalQuestions} questions
        </p>
      </div>

      {/* Missed concepts */}
      {missedConcepts.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "#10101c", border: "1px solid #1e1e38" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#8888aa" }}>
            Concepts to Review
          </p>
          <div className="flex flex-wrap gap-2">
            {missedConcepts.map((c) => (
              <span
                key={c}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(220,38,38,0.12)",
                  border: "1px solid rgba(220,38,38,0.3)",
                  color: "#fca5a5",
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
          <p className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: "#8888aa" }}>
            Wrong Answers
          </p>
          {wrongAnswers.map((wa) => {
            const q = qMap[wa.questionId];
            if (!q) return null;
            return (
              <div
                key={wa.questionId}
                className="rounded-2xl p-5 space-y-3"
                style={{ background: "#10101c", border: "1px solid #1e1e38" }}
              >
                {/* Question */}
                <p className="text-sm font-medium leading-relaxed" style={{ color: "#e8e8f0" }}>
                  {q.question}
                </p>

                {/* User pick */}
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(220,38,38,0.2)", color: "#f87171" }}
                  >
                    ✗
                  </span>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "#8888aa" }}>Your answer</p>
                    <p className="text-sm" style={{ color: "#fca5a5" }}>
                      {wa.userAnswer === -1 ? "Not answered" : q.options[wa.userAnswer]}
                    </p>
                  </div>
                </div>

                {/* Correct */}
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(110,231,183,0.2)", color: "#6ee7b7" }}
                  >
                    ✓
                  </span>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "#8888aa" }}>Correct answer</p>
                    <p className="text-sm" style={{ color: "#6ee7b7" }}>{q.options[wa.correctAnswer]}</p>
                  </div>
                </div>

                {/* Explanation */}
                <div
                  className="rounded-lg px-4 py-3"
                  style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: "#a78bfa" }}>Explanation</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#c4b5fd" }}>{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Perfect score */}
      {wrongAnswers.length === 0 && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: "rgba(110,231,183,0.06)",
            border: "1px solid rgba(110,231,183,0.25)",
          }}
        >
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-heading font-semibold" style={{ color: "#6ee7b7" }}>Perfect score!</p>
          <p className="text-sm mt-1" style={{ color: "#8888aa" }}>You nailed every question.</p>
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
                ? { background: "rgba(124,58,237,0.3)", color: "rgba(255,255,255,0.4)", cursor: "not-allowed" }
                : {
                    background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                    color: "#fff",
                    boxShadow: "0 0 20px rgba(124,58,237,0.35)",
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
          style={{ background: "#10101c", border: "1px solid #1e1e38", color: "#e8e8f0" }}
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
