import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { buildGeneratePrompt } from "@/lib/prompts";
import type { Analysis } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, analysis, difficulty } = body as {
      text: string;
      analysis: Analysis;
      difficulty: string;
    };

    console.log("[/api/generate] Received request with body:", body);

    if (!text || !analysis) {
      return NextResponse.json(
        { error: "text and analysis are required." },
        { status: 400 }
      );
    }

    const prompt = buildGeneratePrompt(text, analysis, difficulty ?? "intermediate");
    const materials = await callClaude(prompt);

    return NextResponse.json(materials);
  } catch (err) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: "Failed to generate study materials. Please try again." },
      { status: 500 }
    );
  }
}
