"use client";

import { useState, useRef, useEffect, useCallback, type DragEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import type { Analysis, GeneratedMaterials } from "@/types";

type Tab = "text" | "pdf";
type Difficulty = "beginner" | "intermediate" | "advanced";
type LoadingPhase = "idle" | "analyzing" | "generating";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const PHASE_MESSAGES: Record<Exclude<LoadingPhase, "idle">, string[]> = {
  analyzing: [
    "Reading your document…",
    "Identifying key concepts…",
    "Mapping topic structure…",
    "Almost done analyzing…",
  ],
  generating: [
    "Building your study guide…",
    "Creating flashcards…",
    "Crafting quiz questions…",
    "Putting it all together…",
  ],
};

export default function HomePage() {
  const router = useRouter();
  const { setSourceText, setAnalysis, setMaterials, difficulty, setDifficulty } = useApp();

  const [tab, setTab] = useState<Tab>("text");
  const [pastedText, setPastedText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<LoadingPhase>("idle");
  const [msgIdx, setMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loading = phase !== "idle";

  // Rotate loading messages
  useEffect(() => {
    if (!loading) {
      setMsgIdx(0);
      return;
    }
    const id = setInterval(() => setMsgIdx((i) => i + 1), 1800);
    return () => clearInterval(id);
  }, [loading]);

  const messages = loading ? PHASE_MESSAGES[phase as Exclude<LoadingPhase, "idle">] : [];
  const currentMsg = messages[msgIdx % messages.length] ?? "";

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

    if (tab === "text" && !pastedText.trim()) {
      setError("Please paste some text to analyze.");
      return;
    }
    if (tab === "pdf" && !pdfFile) {
      setError("Please upload a PDF file.");
      return;
    }

    try {
      // Phase 1: analyze
      setPhase("analyzing");

      let analysisResult: Analysis;

      if (tab === "pdf" && pdfFile) {
        const form = new FormData();
        form.append("file", pdfFile);
        form.append("difficulty", difficulty);

        const res = await fetch("/api/analyze", { method: "POST", body: form });
        if (!res.ok) throw new Error((await res.json()).error ?? "Analysis failed.");
        analysisResult = await res.json();
      } else {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: pastedText, difficulty }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Analysis failed.");
        analysisResult = await res.json();
      }

      const text = tab === "text" ? pastedText : (pdfFile?.name ?? "");
      setAnalysis(analysisResult);
      setSourceText(text);

      // Phase 2: generate
      setPhase("generating");
      setMsgIdx(0);

      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, analysis: analysisResult, difficulty }),
      });
      if (!genRes.ok) throw new Error((await genRes.json()).error ?? "Generation failed.");
      const materialsResult: GeneratedMaterials = await genRes.json();
      setMaterials(materialsResult);

      router.push("/materials");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setPhase("idle");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Background orb */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(ellipse, #7c3aed 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-2xl page-enter">
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full text-xs font-medium tracking-widest uppercase"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}
          >
            AI-Powered Learning
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-3 gradient-text">
            Know - Flow
          </h1>
          <p className="text-text-muted text-base sm:text-lg">
            Drop in any document and get a complete study system — instantly.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-5 sm:p-8 surface" style={{ boxShadow: "0 0 0 1px #1e1e38, 0 24px 64px rgba(0,0,0,0.6)" }}>

          {/* Tab toggle */}
          <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "#0a0a18" }}>
            {(["text", "pdf"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                disabled={loading}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                style={
                  tab === t
                    ? { background: "#16162a", color: "#e8e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }
                    : { color: "#8888aa" }
                }
              >
                {t === "text" ? "Paste Text" : "Upload PDF"}
              </button>
            ))}
          </div>

          {/* Input area */}
          {tab === "text" ? (
            <textarea
              value={pastedText}
              onChange={(e) => { setPastedText(e.target.value); setError(null); }}
              disabled={loading}
              placeholder="Paste your notes, articles, textbook chapters, or any text here…"
              rows={9}
              className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none outline-none transition-all duration-200 disabled:opacity-50 placeholder:text-text-muted"
              style={{
                background: "#0a0a18",
                border: "1px solid #1e1e38",
                color: "#e8e8f0",
                fontFamily: "var(--font-body)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1e1e38")}
            />
          ) : (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !loading && fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all duration-200 select-none"
              style={{
                height: "200px",
                border: `2px dashed ${isDragging ? "#7c3aed" : "#1e1e38"}`,
                background: isDragging ? "rgba(124,58,237,0.08)" : "#0a0a18",
              }}
            >
              {pdfFile ? (
                <>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
                    <PdfIcon />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#e8e8f0" }}>{pdfFile.name}</p>
                  <p className="text-xs" style={{ color: "#8888aa" }}>
                    {(pdfFile.size / 1024).toFixed(0)} KB · Click to replace
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
                    <UploadIcon />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#e8e8f0" }}>
                    Drag & drop your PDF here
                  </p>
                  <p className="text-xs" style={{ color: "#8888aa" }}>or click to browse</p>
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

          {/* Difficulty selector */}
          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "#8888aa" }}>
              Difficulty
            </p>
            <div className="flex gap-2">
              {DIFFICULTIES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDifficulty(value)}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 disabled:opacity-50"
                  style={
                    difficulty === value
                      ? {
                          background: "rgba(124,58,237,0.25)",
                          border: "1px solid rgba(124,58,237,0.6)",
                          color: "#c4b5fd",
                        }
                      : {
                          background: "#0a0a18",
                          border: "1px solid #1e1e38",
                          color: "#8888aa",
                        }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mt-4 flex items-start gap-3 px-4 py-3 rounded-lg text-sm"
              style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }}
            >
              <span className="flex-1">{error}</span>
              <button
                onClick={handleTransform}
                className="flex-shrink-0 text-xs font-medium underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
                style={{ color: "#fca5a5" }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Transform button */}
          <button
            onClick={handleTransform}
            disabled={loading}
            className="mt-5 w-full py-3.5 rounded-xl font-heading font-semibold text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-2"
            style={
              loading
                ? { background: "rgba(124,58,237,0.4)", color: "rgba(255,255,255,0.5)", cursor: "not-allowed" }
                : {
                    background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                    color: "#fff",
                    boxShadow: "0 0 24px rgba(124,58,237,0.45)",
                  }
            }
          >
            {loading ? (
              <>
                <Spinner />
                {currentMsg}
              </>
            ) : (
              <>
                <SparkleIcon />
                Transform
              </>
            )}
          </button>

          {/* Skeleton preview during loading */}
          {loading && (
            <div className="mt-6 space-y-3" aria-hidden>
              <p className="text-xs mb-3" style={{ color: "#8888aa" }}>
                {phase === "analyzing" ? "Analyzing document structure…" : "Generating study materials…"}
              </p>
              <div className="skeleton h-3 w-4/5" />
              <div className="skeleton h-3 w-3/5" />
              <div className="flex gap-3 mt-4">
                <div className="skeleton h-16 flex-1 rounded-xl" />
                <div className="skeleton h-16 flex-1 rounded-xl" />
                <div className="skeleton h-16 flex-1 rounded-xl" />
              </div>
              <div className="skeleton h-3 w-2/3 mt-2" />
              <div className="skeleton h-3 w-4/6" />
            </div>
          )}
        </div>

        {/* Footer hint */}
        {!loading && (
          <p className="text-center text-xs mt-5" style={{ color: "#8888aa" }}>
            Supports text up to 60,000 characters · PDF extraction included
          </p>
        )}
      </div>
    </main>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.88 5.76a1 1 0 00.95.69H21l-4.94 3.59a1 1 0 00-.36 1.12L17.56 20 12 16.31 6.44 20l1.86-5.84a1 1 0 00-.36-1.12L3 9.45h6.17a1 1 0 00.95-.69L12 3z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
