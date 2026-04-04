"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { exportFlashcardsToCSV, exportStudyGuideToPDF } from "@/lib/export";
import ContentMap from "@/components/ContentMap";
import StudyGuide from "@/components/StudyGuide";
import FlashcardDeck from "@/components/FlashcardDeck";

type Tab = "guide" | "cards" | "quiz";

export default function MaterialsPage() {
  const router = useRouter();
  const { analysis, materials, sourceText, resetSession } = useApp();

  // Build tabs only for materials the agent actually generated
  const availableTabs = [
    materials?.studyGuide ? { id: "guide" as Tab, label: "Study Guide" } : null,
    materials?.flashcards?.length ? { id: "cards" as Tab, label: "Flashcards" } : null,
    materials?.quiz?.questions?.length ? { id: "quiz" as Tab, label: "Quiz" } : null,
  ].filter(Boolean) as { id: Tab; label: string }[];

  const [tab, setTab] = useState<Tab | null>(null);

  // Set default tab once materials load
  useEffect(() => {
    if (availableTabs.length > 0 && tab === null) {
      setTab(availableTabs[0].id);
    }
  }, [availableTabs.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Guard: if no materials, go home
  useEffect(() => {
    if (!materials || !analysis) {
      router.replace("/");
    }
  }, [materials, analysis, router]);

  // Close export dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!materials || !analysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 page-enter" style={{ background: "#08080f" }}>
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.12)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <h2 className="font-heading text-xl font-bold mb-2" style={{ color: "#e8e8f8" }}>
            No materials yet
          </h2>
          <p className="text-sm mb-6" style={{ color: "#7070a0" }}>
            Upload a document on the home page to generate your study materials.
          </p>
          <button
            onClick={() => router.replace("/")}
            className="px-6 py-2.5 rounded-xl font-heading font-semibold text-sm transition-all duration-200"
            style={{
              background: "#8b5cf6",
              color: "#fff",
              boxShadow: "0 0 16px rgba(139,92,246,0.4)",
            }}
          >
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  // ── Export handlers ──────────────────────────────────────────────────────

  async function handleCSV() {
    setExportOpen(false);
    if (materials!.flashcards) exportFlashcardsToCSV(materials!.flashcards);
  }

  async function handlePDF() {
    setExportOpen(false);
    setExporting(true);
    try {
      await exportStudyGuideToPDF(materials!.studyGuide?.sections ?? [], analysis!.title);
    } finally {
      setExporting(false);
    }
  }

  function handleBack() {
    resetSession();
    router.push("/");
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen page-enter" style={{ background: "#08080f" }}>

      {/* Top bar */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 py-3"
        style={{
          background: "rgba(8,8,15,0.88)",
          borderBottom: "1px solid #1e1e36",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm transition-colors duration-150"
          style={{ color: "#7070a0" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e8e8f8")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#7070a0")}
        >
          <ArrowLeft /> New document
        </button>

        <div className="flex-1" />

        {/* Export dropdown — only shown when there's something to export */}
        {(materials.flashcards || materials.studyGuide) && <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen((o) => !o)}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: "#0e0e1a",
              border: "1px solid #1e1e36",
              color: "#e8e8f8",
            }}
          >
            {exporting ? <Spinner /> : <ExportIcon />}
            <span className="hidden sm:inline">Export</span>
            <Chevron open={exportOpen} />
          </button>

          {exportOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-30"
              style={{
                background: "#151526",
                border: "1px solid #1e1e36",
                boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
              }}
            >
              {materials.flashcards && (
                <DropdownItem onClick={handleCSV} icon={<CsvIcon />} label="Flashcards as CSV" />
              )}
              {materials.studyGuide && (
                <DropdownItem onClick={handlePDF} icon={<PdfIcon />} label="Study Guide as PDF" />
              )}
            </div>
          )}
        </div>}
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Analysis summary */}
        <ContentMap analysis={analysis} />

        {/* Tab nav */}
        {availableTabs.length > 0 && (
          <div
            className="flex gap-1 mb-6"
            style={{ borderBottom: "1px solid #1e1e36" }}
          >
            {availableTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative px-4 pb-3 pt-1 text-sm font-medium transition-colors duration-150 flex items-center gap-1.5"
                style={{ color: tab === t.id ? "#e8e8f8" : "#7070a0" }}
              >
                {t.label}
                {t.id === "cards" && materials.flashcards && (
                  <span
                    className="px-1.5 py-0.5 rounded text-xs"
                    style={{
                      background: tab === t.id ? "rgba(139,92,246,0.2)" : "rgba(64,64,104,0.3)",
                      color: tab === t.id ? "#60a5fa" : "#7070a0",
                    }}
                  >
                    {materials.flashcards.length}
                  </span>
                )}
                {tab === t.id && (
                  <span
                    className="absolute bottom-[-1px] left-0 right-0"
                    style={{ height: 2, background: "#8b5cf6", borderRadius: "2px 2px 0 0" }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        {tab === "guide" && materials.studyGuide && (
          <StudyGuide sections={materials.studyGuide.sections} />
        )}

        {tab === "cards" && materials.flashcards && (
          <FlashcardDeck flashcards={materials.flashcards} />
        )}

        {tab === "quiz" && materials.quiz && (
          <div
            className="rounded-xl p-10 flex flex-col items-center gap-5 text-center animate-slide-up"
            style={{ background: "#0e0e1a", border: "1px solid #1e1e36" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.12)" }}
            >
              <QuizIcon />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold mb-2" style={{ color: "#e8e8f8" }}>
                Ready to test yourself?
              </h3>
              <p className="text-sm" style={{ color: "#7070a0" }}>
                {materials.quiz.questions.length} questions · adaptive review after
              </p>
            </div>
            <button
              onClick={() => router.push("/quiz")}
              className="px-8 py-3 rounded-xl font-heading font-semibold text-sm transition-all duration-200"
              style={{
                background: "#8b5cf6",
                color: "#fff",
                boxShadow: "0 0 20px rgba(139,92,246,0.4)",
              }}
            >
              Start Quiz →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Small components ─────────────────────────────────────────────────────────

function DropdownItem({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-150"
      style={{ color: "#e8e8f8" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,92,246,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
      {label}
    </button>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
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

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CsvIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function QuizIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeOpacity="0.3" />
      <path d="M12 2v4" />
    </svg>
  );
}
