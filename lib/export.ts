import type { Flashcard, StudyGuideSection } from "@/types";

// ── CSV ────────────────────────────────────────────────────────────────────

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportFlashcardsToCSV(flashcards: Flashcard[]): void {
  const header = ["Front", "Back", "Concept", "Difficulty"].join(",");
  const rows = flashcards.map((fc) =>
    [fc.front, fc.back, fc.concept, fc.difficulty].map(escapeCSV).join(",")
  );
  const csv = [header, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "flashcards.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// ── PDF ────────────────────────────────────────────────────────────────────

export async function exportStudyGuideToPDF(
  sections: StudyGuideSection[],
  title: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const PAGE_W = 210;
  const MARGIN = 18;
  const MAX_W = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  function ensureSpace(needed: number) {
    if (y + needed > 277) {
      doc.addPage();
      y = MARGIN;
    }
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 50);
  const titleLines = doc.splitTextToSize(title, MAX_W) as string[];
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 8 + 6;

  // Divider
  doc.setDrawColor(200, 200, 220);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;

  for (const section of sections) {
    ensureSpace(16);

    // Section heading
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(80, 40, 160);
    const headingLines = doc.splitTextToSize(section.title, MAX_W) as string[];
    doc.text(headingLines, MARGIN, y);
    y += headingLines.length * 6 + 4;

    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 70);
    const bodyLines = doc.splitTextToSize(section.content, MAX_W) as string[];
    for (const line of bodyLines) {
      ensureSpace(5);
      doc.text(line, MARGIN, y);
      y += 5;
    }
    y += 3;

    // Key takeaways
    if (section.keyTakeaways.length > 0) {
      ensureSpace(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 60, 180);
      doc.text("Key Takeaways", MARGIN, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 70);
      for (const tip of section.keyTakeaways) {
        const tipLines = doc.splitTextToSize(`• ${tip}`, MAX_W - 4) as string[];
        for (const line of tipLines) {
          ensureSpace(5);
          doc.text(line, MARGIN + 2, y);
          y += 5;
        }
      }
    }

    y += 8;
  }

  doc.save("study-guide.pdf");
}

// Legacy shims so existing import paths don't break
export function exportToCSV(_data: unknown[]): string {
  return "";
}
export function exportToPDF(_content: string): void {}
