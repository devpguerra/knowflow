import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { buildAnalyzePrompt } from "@/lib/prompts";
import { extractTextFromPDF } from "@/lib/pdf";

const MAX_CHARS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let text: string;
    let difficulty: string;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      difficulty = (form.get("difficulty") as string | null) ?? "intermediate";

      const file = form.get("file") as File | null;
      const pastedText = form.get("text") as string | null;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        text = await extractTextFromPDF(buffer);
      } else if (pastedText) {
        text = pastedText;
      } else {
        return NextResponse.json(
          { error: "Provide either a PDF file or text." },
          { status: 400 }
        );
      }
    } else {
      const body = await req.json();
      text = body.text;
      difficulty = body.difficulty ?? "intermediate";

      if (!text) {
        return NextResponse.json({ error: "text is required." }, { status: 400 });
      }
    }

    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS);
    }

    const prompt = buildAnalyzePrompt(text, difficulty);
    const analysis = await callClaude(prompt);

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("[/api/analyze]", err);
    return NextResponse.json(
      { error: "Failed to analyze content. Please try again." },
      { status: 500 }
    );
  }
}
