"use client";

import type { StudyGuideSection } from "@/types";

interface Props {
  sections: StudyGuideSection[];
}

export default function StudyGuide({ sections }: Props) {
  return (
    <div className="space-y-5 animate-slide-up">
      {sections.map((section, i) => (
        <article
          key={i}
          className="rounded-2xl p-6"
          style={{ background: "#10101c", border: "1px solid #1e1e38" }}
        >
          {/* Section title */}
          <h3
            className="font-heading text-lg font-bold mb-3"
            style={{ color: "#e8e8f0" }}
          >
            {section.title}
          </h3>

          {/* Body — split on newlines for paragraphs */}
          <div className="space-y-3 mb-5">
            {section.content.split(/\n+/).filter(Boolean).map((para, j) => (
              <p
                key={j}
                className="text-sm leading-7"
                style={{ color: "#b8b8cc" }}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Key takeaways */}
          {section.keyTakeaways.length > 0 && (
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "#a78bfa" }}
              >
                Key Takeaways
              </p>
              <ul className="space-y-1.5">
                {section.keyTakeaways.map((tip, k) => (
                  <li key={k} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#7c3aed" }} />
                    <span className="text-sm leading-relaxed" style={{ color: "#c4b5fd" }}>
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
