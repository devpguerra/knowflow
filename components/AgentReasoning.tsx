"use client";

import { useState, useEffect, useRef } from "react";
import type { AgentEvent } from "@/types";

interface Props {
  events: AgentEvent[];
  isLoading?: boolean;
}

const TOOL_LABELS: Record<string, string> = {
  analyze_content: "analyze_content",
  web_search: "web_search",
  generate_flashcards: "generate_flashcards",
  generate_quiz: "generate_quiz",
  generate_study_guide: "generate_study_guide",
  assess_knowledge_gaps: "assess_knowledge_gaps",
};

function fmt(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label="thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#a78bfa",
            animation: `ar-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

export default function AgentReasoning({ events, isLoading = false }: Props) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Derived values
  const toolCallEvents = events.filter(
    (e): e is Extract<AgentEvent, { type: "tool_call" }> => e.type === "tool_call"
  );
  const totalTools = toolCallEvents.reduce((s, e) => s + e.tools.length, 0);
  const reasoningCount = events.filter((e) => e.type === "reasoning").length;

  // Scroll to bottom whenever new content arrives
  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [open, events.length]);

  const hasContent = events.length > 0 || isLoading;
  if (!hasContent) return null;

  return (
    <>
      <style>{`
        @keyframes ar-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes ar-slide-in {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ar-msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Toggle tab (top-right) ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close agent reasoning" : "Open agent reasoning"}
        className="fixed z-50 flex items-center gap-2.5 transition-all duration-300"
        style={{
          top: 156,
          right: open ? 352 : 0,
          background: open ? "#1a1a2e" : "#0d0d1a",
          border: "1px solid #1e1e38",
          borderRight: open ? "1px solid #1e1e38" : "none",
          borderRadius: "10px 0 0 10px",
          padding: "10px 14px 10px 12px",
          color: "#e8e8f0",
          boxShadow: open ? "none" : "-4px 4px 20px rgba(0,0,0,0.4)",
          transition: "right 0.3s cubic-bezier(0.4,0,0.2,1), background 0.2s",
        }}
      >
        {/* Icon */}
        <span
          style={{
            fontSize: 14,
            color: isLoading ? "#a78bfa" : open ? "#8888aa" : "#a78bfa",
            transition: "color 0.2s",
          }}
        >
          ⬡
        </span>

        {/* Text block */}
        <span className="flex flex-col items-start gap-0.5 hidden sm:flex">
          <span
            className="text-[11px] font-semibold tracking-wide leading-none"
            style={{ color: open ? "#8888aa" : "#e8e8f0" }}
          >
            {open ? "Close panel" : "Agent Reasoning"}
          </span>
          {!open && (
            <span
              className="text-[9px] leading-none tabular-nums"
              style={{
                color: "#8888aa",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <ThinkingDots />
                  <span>thinking…</span>
                </span>
              ) : totalTools > 0 ? (
                `${totalTools} tool${totalTools !== 1 ? "s" : ""} · ${reasoningCount} step${reasoningCount !== 1 ? "s" : ""}`
              ) : (
                "view agent steps"
              )}
            </span>
          )}
        </span>

        {/* Chevron */}
        <span
          style={{
            fontSize: 10,
            color: "#8888aa",
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s",
            marginLeft: 2,
          }}
        >
          ›
        </span>
      </button>

      {/* ── Chat panel ── */}
      <div
        className="fixed z-40 flex flex-col"
        style={{
          top: 0,
          right: 0,
          width: 352,
          height: "100vh",
          background: "#0d0d1a",
          borderLeft: "1px solid #1e1e38",
          boxShadow: open ? "-12px 0 40px rgba(0,0,0,0.5)" : "none",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s",
          pointerEvents: open ? "auto" : "none",
        }}
        aria-hidden={!open}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{
            borderBottom: "1px solid #1e1e38",
            background: "#0d0d1a",
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: "#a78bfa", fontSize: 14 }}>⬡</span>
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#a78bfa", fontFamily: "ui-monospace, monospace" }}
            >
              Agent Reasoning
            </span>
            {isLoading && (
              <span
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]"
                style={{
                  background: "rgba(167,139,250,0.1)",
                  border: "1px solid rgba(167,139,250,0.25)",
                  color: "#a78bfa",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                <ThinkingDots />
                <span>thinking</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "#8888aa" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "#e8e8f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#8888aa";
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body — scrollable event list */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#1e1e38 transparent" }}
        >
          {/* Empty / loading state */}
          {isLoading && events.length === 0 && (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs"
              style={{
                background: "rgba(167,139,250,0.06)",
                border: "1px solid rgba(167,139,250,0.15)",
                fontFamily: "ui-monospace, monospace",
                color: "#8888aa",
              }}
            >
              <ThinkingDots />
              <span>Analyzing your content…</span>
            </div>
          )}

          {/* Ordered event timeline */}
          {events.map((event, i) => (
            <div
              key={i}
              style={{
                animation: "ar-msg-in 0.25s ease both",
                animationDelay: `${i * 0.04}s`,
              }}
            >
              {event.type === "reasoning" ? (
                /* ── Reasoning bubble ── */
                <>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px]"
                      style={{ background: "rgba(167,139,250,0.2)", color: "#a78bfa" }}
                    >
                      ⬡
                    </div>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: "#a78bfa", fontFamily: "ui-monospace, monospace" }}
                    >
                      agent
                    </span>
                  </div>
                  <div
                    className="ml-7 rounded-2xl rounded-tl-sm px-3 py-2.5 text-xs leading-relaxed"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid #1e1e38",
                      color: "#c4c4d4",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {event.text}
                  </div>
                </>
              ) : (
                /* ── Tool call block ── */
                (() => {
                  const isParallelGroup = event.parallel && event.tools.length > 1;

                  if (!isParallelGroup) {
                    // Single tool row (sequential or solo parallel)
                    const tool = event.tools[0];
                    return (
                      <div
                        className="rounded-xl overflow-hidden text-xs"
                        style={{
                          border: "1px solid #1e1e38",
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        <div
                          className="flex items-center justify-between px-3 py-2"
                          style={{ background: "rgba(255,255,255,0.015)" }}
                        >
                          <span style={{ color: "#8888aa" }}>
                            {TOOL_LABELS[tool.toolName] ?? tool.toolName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: "#6ee7b7", fontSize: 9 }}>✓</span>
                            <span className="tabular-nums" style={{ color: "#8888aa" }}>
                              {fmt(tool.durationMs)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Parallel group
                  const wallTime = Math.max(...event.tools.map((t) => t.durationMs));
                  const timeSaved =
                    event.tools.reduce((s, t) => s + t.durationMs, 0) - wallTime;

                  return (
                    <div
                      className="rounded-xl overflow-hidden text-xs"
                      style={{
                        border: "1px solid #1e1e38",
                        fontFamily: "ui-monospace, monospace",
                      }}
                    >
                      {/* Parallel header */}
                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5"
                        style={{
                          background: "rgba(245,158,11,0.06)",
                          borderBottom: "1px solid rgba(245,158,11,0.15)",
                        }}
                      >
                        <span style={{ color: "#f59e0b", fontSize: 10 }}>⚡</span>
                        <span
                          className="text-[9px] font-semibold uppercase tracking-widest"
                          style={{ color: "#f59e0b" }}
                        >
                          parallel
                        </span>
                      </div>

                      {/* Individual rows */}
                      {event.tools.map((tool, j) => (
                        <div
                          key={j}
                          className="flex items-center justify-between pl-5 pr-3 py-2"
                          style={{
                            borderBottom:
                              j < event.tools.length - 1 ? "1px solid #1e1e38" : undefined,
                            background: "rgba(245,158,11,0.02)",
                          }}
                        >
                          <span style={{ color: "#8888aa" }}>
                            {TOOL_LABELS[tool.toolName] ?? tool.toolName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: "#6ee7b7", fontSize: 9 }}>✓</span>
                            <span className="tabular-nums" style={{ color: "#8888aa" }}>
                              {fmt(tool.durationMs)}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Wall time footer */}
                      <div
                        className="flex items-center justify-between px-3 py-2"
                        style={{
                          background: "rgba(245,158,11,0.04)",
                          borderTop: "1px solid rgba(245,158,11,0.12)",
                        }}
                      >
                        <span className="text-[10px]" style={{ color: "#8888aa" }}>
                          wall time
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] tabular-nums">
                          <span style={{ color: "#f59e0b" }}>{fmt(wallTime)}</span>
                          {timeSaved > 1000 && (
                            <span
                              className="px-1.5 py-0.5 rounded-full"
                              style={{
                                background: "rgba(245,158,11,0.1)",
                                border: "1px solid rgba(245,158,11,0.2)",
                                color: "#f59e0b",
                              }}
                            >
                              saved ~{fmt(timeSaved)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          ))}

          {/* Thinking indicator after events when still loading */}
          {isLoading && events.length > 0 && (
            <div style={{ animation: "ar-msg-in 0.2s ease both" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px]"
                  style={{ background: "rgba(167,139,250,0.2)", color: "#a78bfa" }}
                >
                  ⬡
                </div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "#a78bfa", fontFamily: "ui-monospace, monospace" }}
                >
                  agent
                </span>
              </div>
              <div
                className="ml-7 rounded-2xl rounded-tl-sm px-3 py-2.5 inline-flex items-center gap-2"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid #1e1e38",
                }}
              >
                <ThinkingDots />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 flex-shrink-0 text-[10px] text-center"
          style={{
            borderTop: "1px solid #1e1e38",
            color: "#8888aa",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {totalTools > 0
            ? `${totalTools} tool${totalTools !== 1 ? "s" : ""} called`
            : "no tools called yet"}
        </div>
      </div>
    </>
  );
}
