"use client";

import type { StudyGuideSection } from "@/types";

interface Props {
  sections: StudyGuideSection[];
}

type ContentSegment =
  | { type: "code"; lang: string; lines: string[] }
  | { type: "text"; lines: string[] };

function parseContent(content: string): ContentSegment[] {
  const lines = content.split("\n");
  const segments: ContentSegment[] = [];
  let i = 0;

  while (i < lines.length) {
    const fenceMatch = lines[i].match(/^```(\w*)$/);
    if (fenceMatch) {
      const lang = fenceMatch[1] || "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      segments.push({ type: "code", lang, lines: codeLines });
    } else {
      const textLines: string[] = [];
      while (i < lines.length && !lines[i].match(/^```/)) {
        textLines.push(lines[i]);
        i++;
      }
      if (textLines.some((l) => l.trim())) {
        segments.push({ type: "text", lines: textLines });
      }
    }
  }

  return segments;
}

/** Split a prose line on inline backtick spans and render code parts as <code>. */
function renderInlineCode(line: string) {
  const parts = line.split(/(`[^`]+`)/g);
  if (parts.length === 1) return <>{line}</>;
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={i}
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{ background: "rgba(124,58,237,0.12)", color: "#c4b5fd" }}
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function renderTextLine(line: string, key: number) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith(">>>") || trimmed.startsWith("...")) {
    return (
      <p key={key} className="text-sm leading-7">
        <code
          className="text-xs font-mono px-1.5 py-0.5 rounded"
          style={{ background: "rgba(124,58,237,0.12)", color: "#c4b5fd" }}
        >
          {trimmed}
        </code>
      </p>
    );
  }
  return (
    <p key={key} className="text-sm leading-7" style={{ color: "#b8b8cc" }}>
      {renderInlineCode(line)}
    </p>
  );
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

          {/* Body — parsed for code blocks and REPL lines */}
          <div className="space-y-3 mb-5">
            {parseContent(section.content).map((seg, j) => {
              if (seg.type === "code") {
                return (
                  <div key={j} className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(124,58,237,0.25)" }}>
                    {seg.lang && (
                      <span
                        className="absolute top-2 right-3 text-xs font-mono font-semibold"
                        style={{ color: "#7c3aed" }}
                      >
                        {seg.lang}
                      </span>
                    )}
                    <pre
                      className="text-xs font-mono leading-6 overflow-x-auto p-4"
                      style={{ background: "#0a0a14", color: "#c4b5fd" }}
                    >
                      <code>{seg.lines.join("\n")}</code>
                    </pre>
                  </div>
                );
              }
              return (
                <div key={j} className="space-y-1">
                  {seg.lines.map((line, k) => renderTextLine(line, k))}
                </div>
              );
            })}
          </div>

          {/* Sources */}
          {section.sources && section.sources.length > 0 && (
            <div className="my-4 pt-4" style={{ borderTop: "1px solid #1e1e38" }}>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "#6b6b88" }}
              >
                Sources
              </p>
              <div className="flex flex-wrap gap-2">
                {section.sources.map((src, k) => (
                  <a
                    key={k}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1 rounded-full transition-opacity hover:opacity-80"
                    style={{
                      color: "#7c3aed",
                      background: "rgba(124,58,237,0.08)",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    {src.title} ↗
                  </a>
                ))}
              </div>
            </div>
          )}

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
