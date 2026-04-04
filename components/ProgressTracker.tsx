"use client";

import type { QuizResult } from "@/types";

interface Props {
  results: QuizResult[];
}

export default function ProgressTracker({ results }: Props) {
  if (results.length === 0) return null;

  const best = Math.max(...results.map((r) => Math.round((r.score / r.totalQuestions) * 100)));
  const latest = Math.round((results[results.length - 1].score / results[results.length - 1].totalQuestions) * 100);
  const improved = results.length > 1 && latest > Math.round((results[results.length - 2].score / results[results.length - 2].totalQuestions) * 100);

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#0e0e1a", border: "1px solid #1e1e36" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7070a0" }}>
          Progress
        </p>
        <div className="flex items-center gap-3">
          {improved && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
              style={{
                background: "rgba(74,222,128,0.1)",
                border: "1px solid rgba(74,222,128,0.28)",
                color: "#4ade80",
              }}
            >
              ↑ Improving
            </span>
          )}
          <span className="text-xs" style={{ color: "#7070a0" }}>
            Best: <span style={{ color: "#8b5cf6" }}>{best}%</span>
          </span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-3">
        {results.map((r, i) => {
          const pct = Math.round((r.score / r.totalQuestions) * 100);
          const isLatest = i === results.length - 1;
          const barH = Math.max(pct, 6); // min 6% height so tiny bars still show

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              {/* Score label */}
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color: isLatest ? "#8b5cf6" : "#7070a0" }}
              >
                {pct}%
              </span>

              {/* Bar track */}
              <div
                className="w-full rounded-lg overflow-hidden"
                style={{
                  height: "72px",
                  background: "#1e1e36",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  className="w-full transition-all duration-700"
                  style={{
                    height: `${barH}%`,
                    background: isLatest
                      ? "linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)"
                      : "rgba(139,92,246,0.3)",
                    borderRadius: "6px 6px 0 0",
                  }}
                />
              </div>

              {/* Round label */}
              <span className="text-xs" style={{ color: "#7070a0" }}>
                R{r.round}
              </span>
            </div>
          );
        })}

        {/* Arrow connectors between bars */}
        {results.length > 1 && (
          <div
            className="absolute pointer-events-none"
            aria-hidden
            style={{ display: "none" }}
          />
        )}
      </div>

      {/* Trend line (text fallback) */}
      {results.length > 1 && (
        <p className="text-xs mt-3 text-center" style={{ color: "#7070a0" }}>
          {results
            .map((r) => `${Math.round((r.score / r.totalQuestions) * 100)}%`)
            .join(" → ")}
        </p>
      )}
    </div>
  );
}
