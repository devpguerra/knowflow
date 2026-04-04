"use client";

import type { Analysis } from "@/types";

interface Props {
  analysis: Analysis;
}

const IMPORTANCE_COLOR: Record<string, string> = {
  high: "#d97706",
  medium: "#8ab0c8",
  low: "#6abf6a",
};

export default function ContentMap({ analysis }: Props) {
  return (
    <div
      className="rounded-xl p-5 mb-6 animate-fade-in"
      style={{ background: "#110e09", border: "1px solid #2a2015" }}
    >
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-heading text-xl font-bold" style={{ color: "#f0e8d8" }}>
            {analysis.title}
          </h2>
          <p className="text-sm mt-1 leading-relaxed max-w-prose" style={{ color: "#8a7560" }}>
            {analysis.summary}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-3 flex-shrink-0">
          <Stat label="Concepts" value={String(analysis.concepts.length)} />
          <Stat label="Study time" value={analysis.estimatedStudyTime} />
        </div>
      </div>

      {/* Topic pills */}
      {analysis.topicAreas.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {analysis.topicAreas.map((topic) => (
            <span
              key={topic}
              className="px-2.5 py-0.5 rounded text-xs font-medium"
              style={{
                background: "rgba(217,119,6,0.1)",
                border: "1px solid rgba(217,119,6,0.25)",
                color: "#f59e0b",
              }}
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Concept list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {analysis.concepts.map((c) => (
          <div
            key={c.name}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "#080604", border: "1px solid #2a2015" }}
          >
            <span
              className="flex-shrink-0"
              style={{
                width: 8,
                height: 8,
                background: IMPORTANCE_COLOR[c.importance] ?? "#d97706",
                transform: "rotate(45deg)",
                display: "inline-block",
              }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "#f0e8d8" }}>
                {c.name}
              </p>
              <p className="text-xs truncate" style={{ color: "#8a7560" }}>
                {c.difficulty}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col items-center px-4 py-2 rounded-xl"
      style={{ background: "#080604", border: "1px solid #2a2015", minWidth: "80px" }}
    >
      <span className="font-heading text-lg font-bold" style={{ color: "#d97706" }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: "#8a7560" }}>
        {label}
      </span>
    </div>
  );
}
