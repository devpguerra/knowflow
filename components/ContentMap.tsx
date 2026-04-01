"use client";

import type { Analysis } from "@/types";

interface Props {
  analysis: Analysis;
}

const IMPORTANCE_COLOR: Record<string, string> = {
  high: "#a78bfa",
  medium: "#60a5fa",
  low: "#6ee7b7",
};

export default function ContentMap({ analysis }: Props) {
  return (
    <div
      className="rounded-2xl p-5 mb-6 animate-fade-in"
      style={{ background: "#10101c", border: "1px solid #1e1e38" }}
    >
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-heading text-xl font-bold" style={{ color: "#e8e8f0" }}>
            {analysis.title}
          </h2>
          <p className="text-sm mt-1 leading-relaxed max-w-prose" style={{ color: "#8888aa" }}>
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
              className="px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "#c4b5fd",
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
            style={{ background: "#0a0a18", border: "1px solid #1e1e38" }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: IMPORTANCE_COLOR[c.importance] ?? "#a78bfa" }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "#e8e8f0" }}>
                {c.name}
              </p>
              <p className="text-xs truncate" style={{ color: "#8888aa" }}>
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
      style={{ background: "#0a0a18", border: "1px solid #1e1e38", minWidth: "80px" }}
    >
      <span className="font-heading text-lg font-bold" style={{ color: "#a78bfa" }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: "#8888aa" }}>
        {label}
      </span>
    </div>
  );
}
