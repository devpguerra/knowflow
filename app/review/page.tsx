"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import AgentReasoning from "@/components/AgentReasoning";
import FlashcardDeck from "@/components/FlashcardDeck";
import StudyGuide from "@/components/StudyGuide";
import QuizRunner from "@/components/QuizRunner";
import ScoreCard from "@/components/ScoreCard";
import ProgressTracker from "@/components/ProgressTracker";
import type { ReviewPack, QuizResult, AgentEvent } from "@/types";

const SS_KEY = "knowflow_review_pack";
const LS_KEY = "knowflow_quiz_results";

function persistResult(result: QuizResult) {
  try {
    const prev: QuizResult[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
    localStorage.setItem(LS_KEY, JSON.stringify([...prev, result]));
  } catch {
    // ignore
  }
}

type Phase = "review" | "quiz" | "score";

export default function ReviewPage() {
  const router = useRouter();
  const { quizResults, addQuizResult, appendAgentEvents, agentEvents } = useApp();

  const [reviewPack, setReviewPack] = useState<ReviewPack | null>(null);
  const [phase, setPhase] = useState<Phase>("review");
  const [retakeResult, setRetakeResult] = useState<QuizResult | null>(null);
  const appended = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.reviewPack) {
          setReviewPack(parsed.reviewPack);
          if (!appended.current) {
            appended.current = true;
            appendAgentEvents((parsed.agentEvents ?? []) as AgentEvent[]);
          }
        } else {
          setReviewPack(parsed);
        }
      } else {
        router.replace("/materials");
      }
    } catch {
      router.replace("/materials");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!reviewPack) return null;

  const retakeRound = quizResults.length + 1;

  function handleRetakeComplete(r: QuizResult) {
    addQuizResult(r);
    persistResult(r);
    setRetakeResult(r);
    setPhase("score");
  }

  function handleRetakeAgain() {
    setRetakeResult(null);
    setPhase("quiz");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen page-enter" style={{ background: "#07070f" }}>
      {/* Agent reasoning panel — reads full history from context */}
      <AgentReasoning events={agentEvents} />

      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 py-3"
        style={{
          background: "rgba(7,7,15,0.85)",
          borderBottom: "1px solid #1e1e38",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => router.push("/materials")}
          className="flex items-center gap-1.5 text-sm transition-colors duration-150"
          style={{ color: "#8888aa" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e8e8f0")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8888aa")}
        >
          <ArrowLeft />
          Materials
        </button>

        <div className="flex-1" />

        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            background: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "#a78bfa",
          }}
        >
          Adaptive Review
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-8 sm:py-10 space-y-5 sm:space-y-6">

        {/* ── REVIEW PHASE ──────────────────────────────────────────────── */}
        {phase === "review" && (
          <>
            {/* Page title */}
            <div className="text-center mb-2 animate-slide-up">
              <h1 className="font-heading text-2xl font-bold" style={{ color: "#e8e8f0" }}>
                Focused Review
              </h1>
              <p className="text-sm mt-1" style={{ color: "#8888aa" }}>
                Targeted material based on your weak areas
              </p>
            </div>

            {/* Progress tracker */}
            {quizResults.length > 0 && <ProgressTracker results={quizResults} />}

            {/* Weak area summary */}
            <div
              className="rounded-2xl p-6 animate-slide-up"
              style={{ background: "#10101c", border: "1px solid #1e1e38" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: "#f87171" }}
                />
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#8888aa" }}>
                  Weak Area Summary
                </p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#b8b8cc" }}>
                {reviewPack.assessment.strategy}
              </p>
            </div>

            {/* Recommended actions */}
            {(reviewPack.assessment.recommendedActions ?? []).length > 0 && (
              <div
                className="rounded-2xl p-6 animate-slide-up"
                style={{
                  background: "rgba(124,58,237,0.07)",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "#a78bfa" }}
                >
                  Recommended Actions
                </p>
                <ul className="space-y-2.5">
                  {(reviewPack.assessment.recommendedActions ?? []).map((action, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className="flex-shrink-0 mt-1 w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed" style={{ color: "#c4b5fd" }}>
                        {action}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Simplified study guide — shown for deep review (score < 50%) */}
            {reviewPack.simplifiedGuide?.sections?.length && (
              <div className="animate-slide-up">
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-4 px-1"
                  style={{ color: "#8888aa" }}
                >
                  Simplified Study Guide
                </p>
                <StudyGuide sections={reviewPack.simplifiedGuide.sections} />
              </div>
            )}

            {/* Focused flashcards */}
            {(reviewPack.focusedFlashcards ?? []).length > 0 && (
              <div className="animate-slide-up">
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-4 px-1"
                  style={{ color: "#8888aa" }}
                >
                  Focused Flashcards · {(reviewPack.focusedFlashcards ?? []).length} cards
                </p>
                <FlashcardDeck flashcards={reviewPack.focusedFlashcards ?? []} />
              </div>
            )}

            {/* Retake CTA */}
            {(reviewPack.retakeQuiz?.questions ?? []).length > 0 && (
              <div
                className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center animate-slide-up"
                style={{ background: "#10101c", border: "1px solid #1e1e38" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.15)" }}
                >
                  <TargetIcon />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold mb-1" style={{ color: "#e8e8f0" }}>
                    Retake Quiz
                  </h3>
                  <p className="text-sm" style={{ color: "#8888aa" }}>
                    {(reviewPack.retakeQuiz?.questions ?? []).length} targeted questions on your weak areas
                  </p>
                </div>
                <button
                  onClick={() => setPhase("quiz")}
                  className="px-8 py-3 rounded-xl font-heading font-semibold text-sm transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                    color: "#fff",
                    boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                  }}
                >
                  Start Retake →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── QUIZ PHASE ────────────────────────────────────────────────── */}
        {phase === "quiz" && (
          <>
            <div className="text-center mb-2 animate-slide-up">
              <div
                className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full text-xs font-medium tracking-widest uppercase"
                style={{
                  background: "rgba(124,58,237,0.15)",
                  border: "1px solid rgba(124,58,237,0.3)",
                  color: "#a78bfa",
                }}
              >
                Round {retakeRound} · Retake
              </div>
              <h1 className="font-heading text-2xl font-bold" style={{ color: "#e8e8f0" }}>
                Targeted Quiz
              </h1>
              <p className="text-sm mt-1" style={{ color: "#8888aa" }}>
                {reviewPack.retakeQuiz?.questions.length ?? 0} questions focused on weak areas
              </p>
            </div>

            <QuizRunner
              questions={reviewPack.retakeQuiz?.questions ?? []}
              round={retakeRound}
              onComplete={handleRetakeComplete}
            />
          </>
        )}

        {/* ── SCORE PHASE ───────────────────────────────────────────────── */}
        {phase === "score" && retakeResult && (
          <>
            <div className="text-center mb-2 animate-slide-up">
              <h1 className="font-heading text-2xl font-bold" style={{ color: "#e8e8f0" }}>
                Retake Complete
              </h1>
              <p className="text-sm mt-1" style={{ color: "#8888aa" }}>
                Round {retakeResult.round} · here&apos;s how you did
              </p>
            </div>

            <ScoreCard
              result={retakeResult}
              questions={reviewPack.retakeQuiz?.questions ?? []}
              allResults={quizResults}
              onReview={handleRetakeAgain}
              onBack={() => router.push("/materials")}
              reviewLoading={false}
            />
          </>
        )}
      </main>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
