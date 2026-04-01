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
    <div className="flex flex-col items-center gap-6 animate-slide-up">
      {/* Progress bar */}
      <div className="w-full max-w-lg">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: "#8888aa" }}>
          <span>
            Card {index + 1} of {flashcards.length}
          </span>
          <span>{knownCount} known</span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: "#1e1e38" }}>
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed, #4f46e5)" }}
          />
        </div>
      </div>

      {/* Flip card */}
      <div
        className="w-full max-w-lg cursor-pointer"
        style={{ perspective: "1200px", height: "260px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 select-none"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: "#10101c",
              border: "1px solid #1e1e38",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "#8888aa" }}>
              Front · {card.concept}
            </p>
            <p className="font-heading text-xl font-semibold text-center leading-snug" style={{ color: "#e8e8f0" }}>
              {card.front}
            </p>
            <p className="text-xs mt-6" style={{ color: "#8888aa" }}>
              Click to reveal
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 select-none"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg, #14102a 0%, #10101c 100%)",
              border: "1px solid rgba(124,58,237,0.4)",
              boxShadow: "0 8px 32px rgba(124,58,237,0.15)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "#a78bfa" }}>
              Back · {card.difficulty}
            </p>
            <p className="text-base text-center leading-relaxed" style={{ color: "#e8e8f0" }}>
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
          style={{ background: "#10101c", border: "1px solid #1e1e38", color: "#e8e8f0" }}
        >
          ← Prev
        </button>

        <button
          onClick={toggleKnown}
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-150"
          style={
            isKnown
              ? { background: "rgba(110,231,183,0.15)", border: "1px solid rgba(110,231,183,0.4)", color: "#6ee7b7" }
              : { background: "#10101c", border: "1px solid #1e1e38", color: "#8888aa" }
          }
        >
          {isKnown ? "✓ Known" : "Mark as known"}
        </button>

        <button
          onClick={() => go(1)}
          disabled={index === flashcards.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-30"
          style={{ background: "#10101c", border: "1px solid #1e1e38", color: "#e8e8f0" }}
        >
          Next →
        </button>
      </div>

      {/* Difficulty badge */}
      <span
        className="px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={{
          background: "rgba(124,58,237,0.12)",
          border: "1px solid rgba(124,58,237,0.25)",
          color: "#c4b5fd",
        }}
      >
        {card.difficulty}
      </span>
    </div>
  );
}
