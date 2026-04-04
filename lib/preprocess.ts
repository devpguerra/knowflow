// ── Programmatic extractive document preprocessing ────────────────────────
//
// Reduces large documents before sending to the LLM.
// No API calls — pure text processing.
//
// Strategy:
// 1. Extract section headings via heuristics (ALL CAPS, numbered, etc.)
// 2. Split text into scoring units (paragraphs or sentences for long paragraphs)
// 3. Score each unit by word frequency (TF-based — words that appear often
//    are likely domain-relevant; stopwords are excluded)
// 4. Keep top-scoring units in original order until targetChars is reached
// 5. Prepend extracted headings as a structure hint for the LLM

const STOPWORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "by","from","up","about","into","is","are","was","were","be","been",
  "being","have","has","had","do","does","did","will","would","could",
  "should","may","might","can","it","its","this","that","these","those",
  "i","we","you","he","she","they","me","us","him","her","them","my",
  "our","your","his","their","what","which","who","when","where","how",
  "all","both","each","more","most","other","some","such","no","not",
  "only","same","so","than","too","very","just","as","if","also","then",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Extract section headings using heuristics:
 * - ALL CAPS short lines
 * - Lines matching numbered/labeled patterns (Chapter N, Section N.N, "1.", "1.1.2")
 */
export function extractHeadings(text: string): string[] {
  const seen = new Set<string>();
  const headings: string[] = [];

  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.length > 120 || t.length < 3) continue;

    const isAllCaps = t === t.toUpperCase() && /[A-Z]{2,}/.test(t);
    const isNumbered = /^(\d+\.)+\s+\S|^(chapter|section|part|unit|module)\s+\d/i.test(t);

    if ((isAllCaps || isNumbered) && !seen.has(t)) {
      seen.add(t);
      headings.push(t);
    }
  }

  return headings.slice(0, 25);
}

/**
 * Split text into scoring units.
 * Short paragraphs (≤500 chars) are kept whole.
 * Long paragraphs are split into individual sentences.
 */
function splitUnits(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 20);
  const units: string[] = [];

  for (const para of paragraphs) {
    if (para.length <= 500) {
      units.push(para);
    } else {
      const sentences = para.match(/[^.!?]+[.!?]+\s*/g) ?? [para];
      units.push(...sentences.map((s) => s.trim()).filter((s) => s.length > 20));
    }
  }

  return units;
}

/**
 * Reduce a document to targetChars using TF-based sentence scoring.
 * Returns the condensed text and extracted headings.
 *
 * If text is already within targetChars, returns it unchanged.
 */
export function preprocessDocument(
  text: string,
  targetChars: number
): { condensedText: string; headings: string[] } {
  const headings = extractHeadings(text);

  if (text.length <= targetChars) {
    return { condensedText: text, headings };
  }

  // Build word frequency table across the full document
  const freq = new Map<string, number>();
  for (const word of tokenize(text)) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  const units = splitUnits(text);

  // Score each unit: sum of word frequencies / sqrt(word count) for length normalization
  const scored = units.map((unit, index) => {
    const words = tokenize(unit);
    if (words.length === 0) return { unit, index, score: 0 };
    const score = words.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0) / Math.sqrt(words.length);
    return { unit, index, score };
  });

  // Pick top-scoring units until we hit the target, then reconstruct in original order
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const selected = new Set<number>();
  let charCount = 0;

  for (const { unit, index, score } of sorted) {
    if (score === 0 || charCount >= targetChars) break;
    selected.add(index);
    charCount += unit.length;
  }

  const condensedBody = scored
    .filter((s) => selected.has(s.index))
    .map((s) => s.unit)
    .join("\n\n");

  // Prepend structure hint so the LLM knows the document's sections
  const structureNote =
    headings.length > 0 ? `[Document sections: ${headings.join(" | ")}]\n\n` : "";

  return { condensedText: structureNote + condensedBody, headings };
}
