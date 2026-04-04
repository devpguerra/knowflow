"use client";

import { useState, useCallback } from "react";
import type { Flashcard } from "@/types";

interface Props {
  flashcards: Flashcard[];
}

export default function FlashcardDeck({ flashcards }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());

  const card = flashcards[index];
  const isKnown = known.has(card.id);
  const knownCount = known.size;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = i + delta;
        if (next < 0 || next >= flashcards.length) return i;
        return next;
      });
      setFlipped(false);
    },
    [flashcards.length]
  );

  function toggleKnown() {
    setKnown((prev) => {
      const next = new Set(prev);
      next.has(card.id) ? next.delete(card.id) : next.add(card.id);
      return next;
    });
  }

  const pct = flashcards.length > 0 ? (knownCount / flashcards.length) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Progress bar */}
      <div className="w-full max-w-lg">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: "#8a7560" }}>
          <span>Card {index + 1} of {flashcards.length}</span>
          <span>{knownCount} known</span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: "#2a2015" }}>
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #d97706, #b45309)",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Flip card */}
      <div
        className="w-full max-w-lg cursor-pointer select-none"
        style={{ perspective: "1400px", height: "260px" }}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        aria-label={flipped ? "Show question" : "Reveal answer"}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)",
          }}
        >
          {/* Front face */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: "#110e09",
              border: "1px solid #2a2015",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "#8a7560" }}>
              {card.concept}
            </p>
            <p className="font-heading text-xl font-semibold text-center leading-snug" style={{ color: "#f0e8d8" }}>
              {card.front}
            </p>
            <p className="text-xs mt-6" style={{ color: "#8a7560" }}>
              Tap to reveal answer
            </p>
          </div>

          {/* Back face */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg, #1e1505 0%, #110e09 100%)",
              border: "1px solid rgba(217,119,6,0.4)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
              boxShadow: "0 8px 40px rgba(217,119,6,0.12)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "#d97706" }}>
              Answer · {card.difficulty}
            </p>
            <p className="text-base text-center leading-relaxed" style={{ color: "#f0e8d8" }}>
              {card.back}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 w-full max-w-lg">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-30"
          style={{ background: "#110e09", border: "1px solid #2a2015", color: "#f0e8d8" }}
        >
          ← Prev
        </button>

        <button
          onClick={toggleKnown}
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          style={
            isKnown
              ? { background: "rgba(90,154,90,0.15)", border: "1px solid rgba(90,154,90,0.4)", color: "#6abf6a" }
              : { background: "#110e09", border: "1px solid #2a2015", color: "#8a7560" }
          }
        >
          {isKnown ? "✓ Known" : "Mark as known"}
        </button>

        <button
          onClick={() => go(1)}
          disabled={index === flashcards.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-30"
          style={{ background: "#110e09", border: "1px solid #2a2015", color: "#f0e8d8" }}
        >
          Next →
        </button>
      </div>

      {/* Concept tag */}
      <span
        className="px-2.5 py-0.5 rounded text-xs font-medium"
        style={{
          background: "rgba(217,119,6,0.1)",
          border: "1px solid rgba(217,119,6,0.25)",
          color: "#f59e0b",
        }}
      >
        {card.concept}
      </span>
    </div>
  );
}
