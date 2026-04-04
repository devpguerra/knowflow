"use client";

import { useEffect, useState, useRef } from "react";

export type LoadingPhase = "analyzing" | "searching" | "generating" | "reviewing";

interface Props {
  phase: LoadingPhase;
}

// ── Per-phase messages ────────────────────────────────────────────────────────

const MESSAGES: Record<LoadingPhase, string[]> = {
  analyzing: [
    "Reading through your content…",
    "Mapping out key concepts…",
    "Identifying topic structure…",
    "Gauging difficulty and depth…",
  ],
  searching: [
    "Looking for supplementary context…",
    "Scanning relevant sources…",
    "Found something useful…",
    "Pulling in extra context…",
  ],
  generating: [
    "Building your study materials…",
    "Running generation in parallel…",
    "Almost there…",
  ],
  reviewing: [
    "Analyzing your quiz results…",
    "Identifying knowledge gaps…",
    "Designing your review strategy…",
    "Selecting focused materials…",
  ],
};

const PHASE_LABELS: Record<LoadingPhase, string> = {
  analyzing: "Analyzing",
  searching: "Searching",
  generating: "Generating",
  reviewing: "Reviewing",
};

// Parallel generation items — each gets an independent progress bar
const GEN_ITEMS = [
  { label: "flashcards", accent: "#8b5cf6", dur: 3.1 },
  { label: "quiz questions", accent: "#4ade80", dur: 4.4 },
  { label: "study guide", accent: "#60a5fa", dur: 3.8 },
] as const;

// ── Thinking indicator — equalizer bars ───────────────────────────────────────

function Equalizer({ accent = "#8b5cf6" }: { accent?: string }) {
  const bars = [0.6, 1, 0.75, 1, 0.5];
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 20 }}>
      {bars.map((base, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: "100%",
            borderRadius: 2,
            background: accent,
            opacity: 0.85,
            transformOrigin: "bottom",
            animation: `la-eq ${0.7 + i * 0.13}s ease-in-out ${i * 0.08}s infinite alternate`,
            transform: `scaleY(${base})`,
          }}
        />
      ))}
    </div>
  );
}

// ── Radar pulse (searching) ────────────────────────────────────────────────────

function RadarPulse() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 16 + i * 16,
            height: 16 + i * 16,
            border: "1.5px solid #8b5cf6",
            opacity: 0,
            animation: `la-radar 2s ease-out ${i * 0.55}s infinite`,
          }}
        />
      ))}
      <div
        className="rounded-full z-10"
        style={{ width: 10, height: 10, background: "#8b5cf6", boxShadow: "0 0 10px #8b5cf6" }}
      />
    </div>
  );
}

// ── Neural node (analyzing / reviewing) ──────────────────────────────────────

function NeuralPulse({ phase }: { phase: LoadingPhase }) {
  const accent = phase === "reviewing" ? "#60a5fa" : "#8b5cf6";
  const nodes = [
    { x: 28, y: 4 },
    { x: 52, y: 18 },
    { x: 52, y: 42 },
    { x: 28, y: 56 },
    { x: 4, y: 42 },
    { x: 4, y: 18 },
  ];
  return (
    <svg width="56" height="60" viewBox="0 0 56 60" fill="none" style={{ overflow: "visible" }}>
      {/* Edges */}
      {nodes.map((n, i) => {
        const next = nodes[(i + 1) % nodes.length];
        return (
          <line
            key={i}
            x1={n.x} y1={n.y} x2={next.x} y2={next.y}
            stroke={accent}
            strokeWidth="1"
            strokeOpacity="0.25"
          />
        );
      })}
      {/* Spoke to center */}
      {nodes.map((n, i) => (
        <line
          key={`s${i}`}
          x1={n.x} y1={n.y} x2={28} y2={30}
          stroke={accent}
          strokeWidth="0.75"
          strokeOpacity="0.15"
        />
      ))}
      {/* Satellite nodes */}
      {nodes.map((n, i) => (
        <circle
          key={`n${i}`}
          cx={n.x} cy={n.y} r={2.5}
          fill={accent}
          opacity={0.5}
          style={{
            animation: `la-node-pulse 1.8s ease-in-out ${i * 0.22}s infinite`,
          }}
        />
      ))}
      {/* Center */}
      <circle cx={28} cy={30} r={5} fill={accent} opacity={0.9}
        style={{ animation: "la-center-pulse 1.4s ease-in-out infinite" }} />
      <circle cx={28} cy={30} r={9} fill="none" stroke={accent} strokeWidth="1"
        strokeOpacity="0.3"
        style={{ animation: "la-center-pulse 1.4s ease-in-out infinite" }} />
    </svg>
  );
}

// ── Parallel progress bars (generating) ──────────────────────────────────────

function ParallelBars() {
  const [widths, setWidths] = useState([0, 0, 0]);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    // Each bar increments at its own pace and stalls randomly to feel natural
    timers.current = GEN_ITEMS.map((item, i) => {
      return setInterval(() => {
        setWidths((prev) => {
          const next = [...prev];
          const remaining = 100 - next[i];
          // Faster at start, slows near completion, never quite reaches 100
          const step = remaining > 30 ? 3 + Math.random() * 4 : 0.5 + Math.random() * 1.5;
          next[i] = Math.min(next[i] + step, 92);
          return next;
        });
      }, item.dur * 100);
    });
    return () => timers.current.forEach(clearInterval);
  }, []);

  return (
    <div className="w-full space-y-3">
      {GEN_ITEMS.map((item, i) => (
        <div key={item.label}>
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-xs font-medium"
              style={{ color: "#94a3b8", fontFamily: "ui-monospace, monospace" }}
            >
              {item.label}
            </span>
            <span
              className="text-[10px] tabular-nums"
              style={{ color: item.accent, fontFamily: "ui-monospace, monospace" }}
            >
              {Math.round(widths[i])}%
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 4, background: "#1e1e36" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${widths[i]}%`,
                background: `linear-gradient(90deg, ${item.accent}88, ${item.accent})`,
                boxShadow: `0 0 6px ${item.accent}55`,
                transitionDuration: "200ms",
              }}
            />
          </div>
        </div>
      ))}
      <p className="text-[10px] text-center mt-1" style={{ color: "#7070a0", fontFamily: "ui-monospace, monospace" }}>
        ⚡ running in parallel
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LoadingAgent({ phase }: Props) {
  const messages = MESSAGES[phase];
  const [msgIdx, setMsgIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  // Rotate messages with a fade-out/in
  useEffect(() => {
    setMsgIdx(0);
    setVisible(true);
  }, [phase]);

  useEffect(() => {
    const fade = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 300);
    }, 2400);
    return () => clearInterval(fade);
  }, [messages]);

  const accent = phase === "reviewing" ? "#60a5fa" : "#8b5cf6";
  const accentDim = phase === "reviewing" ? "rgba(96,165,250,0.1)" : "rgba(139,92,246,0.1)";
  const accentBorder = phase === "reviewing" ? "rgba(96,165,250,0.25)" : "rgba(139,92,246,0.25)";

  return (
    <>
      <style>{`
        @keyframes la-eq {
          from { transform: scaleY(var(--from, 0.2)); }
          to   { transform: scaleY(1); }
        }
        @keyframes la-radar {
          0%   { transform: scale(0.3); opacity: 0.8; }
          100% { transform: scale(1);   opacity: 0; }
        }
        @keyframes la-node-pulse {
          0%, 100% { opacity: 0.4; r: 2.5; }
          50%       { opacity: 1;   r: 3.5; }
        }
        @keyframes la-center-pulse {
          0%, 100% { opacity: 0.8; }
          50%       { opacity: 1; }
        }
        @keyframes la-msg-fade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="w-full flex flex-col items-center gap-5 py-6 px-4">

        {/* Phase badge */}
        <div
          className="flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-widest"
          style={{ background: accentDim, border: `1px solid ${accentBorder}`, color: accent }}
        >
          <Equalizer accent={accent} />
          <span>{PHASE_LABELS[phase]}</span>
        </div>

        {/* Phase-specific visual */}
        <div className="flex justify-center" style={{ minHeight: 60 }}>
          {phase === "searching" ? (
            <RadarPulse />
          ) : phase === "generating" ? null : (
            <NeuralPulse phase={phase} />
          )}
        </div>

        {/* Parallel bars — only for generating */}
        {phase === "generating" && (
          <div className="w-full max-w-xs">
            <ParallelBars />
          </div>
        )}

        {/* Rotating message */}
        <p
          className="text-sm text-center max-w-xs leading-relaxed"
          style={{
            color: "#94a3b8",
            minHeight: 20,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(4px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          {messages[msgIdx]}
        </p>
      </div>
    </>
  );
}
