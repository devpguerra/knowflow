"use client";

import { useState, useRef, useEffect, useCallback, type DragEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import LoadingAgent, { type LoadingPhase } from "@/components/LoadingAgent";
import type { Analysis, GeneratedMaterials, AgentEvent } from "@/types";

type Tab = "topic" | "text" | "pdf";
type Difficulty = "beginner" | "intermediate" | "advanced";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

// Phase advances every ~3s to simulate agent progress
const PHASE_SEQUENCE: LoadingPhase[] = [
  "analyzing", "analyzing", "analyzing",
  "searching",
  "generating", "generating", "generating",
];

export default function HomePage() {
  const router = useRouter();
  const { setSourceText, setAnalysis, setMaterials, appendAgentEvents, difficulty, setDifficulty } = useApp();

  const [tab, setTab] = useState<Tab>("topic");
  const [topicInput, setTopicInput] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advance phase every 3 s while loading
  useEffect(() => {
    if (!loading) { setPhaseIdx(0); return; }
    const id = setInterval(() => setPhaseIdx((i) => Math.min(i + 1, PHASE_SEQUENCE.length - 1)), 3000);
    return () => clearInterval(id);
  }, [loading]);

  const currentPhase: LoadingPhase = PHASE_SEQUENCE[phaseIdx] ?? "generating";

  // ── Drag and drop ──────────────────────────────────────────────────────────

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === "application/pdf") {
      setPdfFile(file);
      setError(null);
    } else {
      setError("Please drop a PDF file.");
    }
  }, []);

  const onFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      setError(null);
    }
  }, []);

  // ── Transform ──────────────────────────────────────────────────────────────

  async function handleTransform() {
    setError(null);

    if (tab === "topic" && !topicInput.trim()) {
      setError("Please enter a topic to study.");
      return;
    }
    if (tab === "text" && !pastedText.trim()) {
      setError("Please paste some text to analyze.");
      return;
    }
    if (tab === "pdf" && !pdfFile) {
      setError("Please upload a PDF file.");
      return;
    }

    try {
      setLoading(true);

      let res: Response;

      if (tab === "topic") {
        res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: topicInput.trim(), difficulty }),
        });
      } else if (tab === "pdf" && pdfFile) {
        const form = new FormData();
        form.append("file", pdfFile);
        form.append("difficulty", difficulty);
        res = await fetch("/api/agent", { method: "POST", body: form });
      } else {
        res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: pastedText, difficulty }),
        });
      }

      if (!res.ok) throw new Error((await res.json()).error ?? "Agent failed.");
      const { analysis, materials, agentEvents } = await res.json() as { analysis: Analysis; materials: GeneratedMaterials; agentEvents: AgentEvent[] };

      setAnalysis(analysis);
      setMaterials(materials);
      appendAgentEvents(agentEvents ?? []);
      setSourceText(
        tab === "topic" ? topicInput.trim() :
        tab === "text"  ? pastedText :
        (pdfFile?.name ?? "")
      );

      router.push("/materials");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Purple/blue ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-[-15%] left-[30%] -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-[0.15] blur-3xl"
        style={{ background: "radial-gradient(ellipse, #8b5cf6 0%, transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed top-[-10%] right-[15%] w-[500px] h-[400px] rounded-full opacity-[0.08] blur-3xl"
        style={{ background: "radial-gradient(ellipse, #3b82f6 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-xl page-enter">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          {/* Ornamental badge */}
          <div
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 text-xs font-medium tracking-[0.18em] uppercase"
            style={{
              border: "1px solid rgba(139,92,246,0.35)",
              color: "#8b5cf6",
              background: "rgba(139,92,246,0.06)",
            }}
          >
            <DiamondIcon size={7} />
            <span>AI Knowledge Transformer</span>
            <DiamondIcon size={7} />
          </div>

          {/* Title */}
          <h1 className="font-heading text-5xl sm:text-6xl font-bold tracking-tight mb-4 gradient-text" style={{ fontStyle: "italic" }}>
            Know—Flow
          </h1>

          {/* Thin ornamental rule */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div style={{ width: 48, height: 1, background: "linear-gradient(to right, transparent, rgba(139,92,246,0.4))" }} />
            <DiamondIcon size={6} color="#8b5cf6" />
            <div style={{ width: 48, height: 1, background: "linear-gradient(to left, transparent, rgba(139,92,246,0.4))" }} />
          </div>

          <p className=" text-base sm:text-lg leading-relaxed">
            Drop in any document and get a complete study system — instantly.
          </p>
        </div>

        {/* ── Card ──────────────────────────────────────────────────────── */}
        <div
          className="rounded-xl p-5 sm:p-8"
          style={{
            background: "#0e0e1a",
            border: "1px solid #1e1e36",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.06), 0 24px 64px rgba(0,0,0,0.7)",
          }}
        >
          {/* ── Tab nav: editorial underline style ── */}
          <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid #1e1e36" }}>
            {(["topic", "text", "pdf"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                disabled={loading}
                className="relative px-4 pb-3 pt-1 text-sm font-medium transition-colors duration-150 disabled:opacity-40"
                style={{ color: tab === t ? "#e8e8f8" : "#7070a0" }}
              >
                {t === "topic" ? "Topic" : t === "text" ? "Paste Text" : "Upload PDF"}
                {tab === t && (
                  <span
                    className="absolute bottom-[-1px] left-0 right-0"
                    style={{ height: 2, background: "#8b5cf6", borderRadius: "2px 2px 0 0" }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── Input area ── */}
          {tab === "topic" ? (
            <input
              type="text"
              value={topicInput}
              onChange={(e) => { setTopicInput(e.target.value); setError(null); }}
              disabled={loading}
              placeholder="e.g., Photosynthesis, Machine Learning, The French Revolution"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all duration-200 disabled:opacity-50 placeholder:text-text-muted"
              style={{
                background: "#0a0a18",
                border: "1px solid #1e1e36",
                color: "#e8e8f8",
                fontFamily: "var(--font-body)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#8b5cf6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1e1e36")}
            />
          ) : tab === "text" ? (
            <textarea
              value={pastedText}
              onChange={(e) => { setPastedText(e.target.value); setError(null); }}
              disabled={loading}
              placeholder="Paste your notes, articles, textbook chapters, or any text here…"
              rows={9}
              className="w-full rounded-lg px-4 py-3 text-sm leading-relaxed resize-none outline-none transition-all duration-200 disabled:opacity-50 placeholder:text-text-muted"
              style={{
                background: "#0a0a18",
                border: "1px solid #1e1e36",
                color: "#e8e8f8",
                fontFamily: "var(--font-body)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#8b5cf6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1e1e36")}
            />
          ) : (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !loading && fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-lg cursor-pointer transition-all duration-200 select-none"
              style={{
                height: "200px",
                border: `2px dashed ${isDragging ? "#8b5cf6" : "#1e1e36"}`,
                background: isDragging ? "rgba(139,92,246,0.06)" : "#0a0a18",
              }}
            >
              {pdfFile ? (
                <>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.15)" }}>
                    <PdfIcon />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#e8e8f8" }}>{pdfFile.name}</p>
                  <p className="text-xs" style={{ color: "#7070a0" }}>
                    {(pdfFile.size / 1024).toFixed(0)} KB · Click to replace
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
                    <UploadIcon />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#e8e8f8" }}>
                    Drag & drop your PDF here
                  </p>
                  <p className="text-xs" style={{ color: "#7070a0" }}>or click to browse</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          )}

          {/* ── Difficulty selector ── */}
          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-widest mb-2.5" style={{ color: "#7070a0" }}>
              Difficulty
            </p>
            <div
              className="flex p-0.5 rounded-lg"
              style={{ background: "#0a0a18", border: "1px solid #1e1e36" }}
            >
              {DIFFICULTIES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDifficulty(value)}
                  disabled={loading}
                  className="flex-1 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 disabled:opacity-50"
                  style={
                    difficulty === value
                      ? { background: "#8b5cf6", color: "#fff" }
                      : { color: "#7070a0" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div
              className="mt-4 flex items-start gap-3 px-4 py-3 rounded-lg text-sm"
              style={{ background: "rgba(184,82,82,0.12)", border: "1px solid rgba(184,82,82,0.3)", color: "#e08080" }}
            >
              <span className="flex-1">{error}</span>
              <button
                onClick={handleTransform}
                className="flex-shrink-0 text-xs font-medium underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
                style={{ color: "#e08080" }}
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Transform button ── */}
          <button
            onClick={handleTransform}
            disabled={loading}
            className="mt-5 w-full py-3.5 rounded-xl font-heading font-semibold text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-2"
            style={
              loading
                ? { background: "rgba(139,92,246,0.35)", color: "rgba(255,255,255,0.5)", cursor: "not-allowed" }
                : {
                    background: "#8b5cf6",
                    color: "#fff",
                    boxShadow: "0 0 28px rgba(139,92,246,0.4)",
                  }
            }
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.boxShadow = "0 0 36px rgba(139,92,246,0.5)"; } }}
            onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = "#8b5cf6"; e.currentTarget.style.boxShadow = "0 0 28px rgba(139,92,246,0.4)"; } }}
          >
            {loading ? <><Spinner /> Working…</> : <><SparkleIcon /> Transform</>}
          </button>

          {/* ── Agent loading display ── */}
          {loading && (
            <div className="mt-4 rounded-xl overflow-hidden" style={{ border: "1px solid #1e1e36", background: "#0a0a18" }}>
              <LoadingAgent phase={currentPhase} />
            </div>
          )}
        </div>

        {/* ── Footer hint ── */}
        {!loading && (
          <p className="text-center text-xs mt-5" style={{ color: "#7070a0" }}>
            {tab === "topic"
              ? "Topic mode uses web search to build study materials from scratch"
              : tab === "text"
              ? "Supports text up to 60,000 characters"
              : "PDF extraction included · up to 60,000 characters extracted"}
          </p>
        )}
      </div>
    </main>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function DiamondIcon({ size = 8, color = "#8b5cf6" }: { size?: number; color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        background: color,
        transform: "rotate(45deg)",
        flexShrink: 0,
      }}
    />
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.88 5.76a1 1 0 00.95.69H21l-4.94 3.59a1 1 0 00-.36 1.12L17.56 20 12 16.31 6.44 20l1.86-5.84a1 1 0 00-.36-1.12L3 9.45h6.17a1 1 0 00.95-.69L12 3z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeOpacity="0.4" />
      <path d="M12 2v4" strokeOpacity="1" />
    </svg>
  );
}
