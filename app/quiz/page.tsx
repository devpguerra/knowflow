"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import QuizRunner from "@/components/QuizRunner";
import ScoreCard from "@/components/ScoreCard";
import LoadingAgent from "@/components/LoadingAgent";
import type { QuizResult, ReviewPack, AgentEvent } from "@/types";

const LS_KEY = "knowflow_quiz_results";

function persistResult(result: QuizResult) {
  try {
    const prev: QuizResult[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
    localStorage.setItem(LS_KEY, JSON.stringify([...prev, result]));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export default function QuizPage() {
  const router = useRouter();
  const { materials, analysis, sourceText, quizResults, addQuizResult } = useApp();

  const [result, setResult] = useState<QuizResult | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Guard: redirect if no materials loaded
  useEffect(() => {
    if (!materials || !analysis) {
      router.replace("/");
    }
  }, [materials, analysis, router]);

  if (!materials || !analysis) return null;

  const questions = materials.quiz?.questions ?? [];
  const round = quizResults.length + 1;

  function handleComplete(r: QuizResult) {
    addQuizResult(r);
    persistResult(r);
    setResult(r);
  }

  async function handleReview() {
    if (!result) return;
    setReviewLoading(true);
    try {
      const res = await fetch("/api/agent/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText,
          quizResult: result,
          questions,
        }),
      });
      if (!res.ok) throw new Error("Review generation failed.");
      const { reviewPack, agentEvents } = await res.json() as {
        reviewPack: ReviewPack;
        agentEvents: AgentEvent[];
      };
      sessionStorage.setItem("knowflow_review_pack", JSON.stringify({ reviewPack, agentEvents }));
      router.push("/review");
    } catch (err) {
      console.error("[quiz/handleReview]", err);
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div className="min-h-screen page-enter" style={{ background: "#080604" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 py-3"
        style={{
          background: "rgba(8,6,4,0.88)",
          borderBottom: "1px solid #2a2015",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => router.push("/materials")}
          className="flex items-center gap-1.5 text-sm transition-colors duration-150"
          style={{ color: "#8a7560" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f0e8d8")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8a7560")}
        >
          <ArrowLeft />
          {result ? "Back to materials" : "Materials"}
        </button>

        <div className="flex-1" />

        <span className="hidden sm:inline text-sm font-medium truncate max-w-xs" style={{ color: "#d97706" }}>
          {analysis.title.length > 40 ? analysis.title.slice(0, 40) + "…" : analysis.title}
        </span>
      </header>

      {/* Content */}
      <main className="px-3 sm:px-4 py-8 sm:py-10">
        {!result ? (
          <>
            {/* Quiz header */}
            <div className="max-w-2xl mx-auto mb-8 text-center">
              <div
                className="inline-flex items-center gap-2 mb-3 px-3 py-1 text-xs font-medium tracking-widest uppercase"
                style={{
                  background: "rgba(217,119,6,0.1)",
                  border: "1px solid rgba(217,119,6,0.3)",
                  color: "#d97706",
                }}
              >
                Round {round}
              </div>
              <h1 className="font-heading text-2xl font-bold" style={{ color: "#f0e8d8" }}>
                Knowledge Check
              </h1>
              <p className="text-sm mt-1" style={{ color: "#8a7560" }}>
                {questions.length} questions · select an answer to advance
              </p>
            </div>

            <QuizRunner
              questions={questions}
              round={round}
              onComplete={handleComplete}
            />
          </>
        ) : reviewLoading ? (
          /* Review agent loading */
          <div className="max-w-sm mx-auto rounded-xl overflow-hidden" style={{ border: "1px solid #2a2015", background: "#0a0704" }}>
            <LoadingAgent phase="reviewing" />
          </div>
        ) : (
          <>
            {/* Score header */}
            <div className="max-w-2xl mx-auto mb-8 text-center">
              <h1 className="font-heading text-2xl font-bold" style={{ color: "#f0e8d8" }}>
                Quiz Complete
              </h1>
              <p className="text-sm mt-1" style={{ color: "#8a7560" }}>
                Round {result.round} · here&apos;s how you did
              </p>
            </div>

            <ScoreCard
              result={result}
              questions={questions}
              allResults={quizResults}
              onReview={handleReview}
              onBack={() => router.push("/materials")}
              reviewLoading={reviewLoading}
            />
          </>
        )}
      </main>
    </div>
  );
}

function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
