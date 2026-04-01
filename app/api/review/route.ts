import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { buildReviewPrompt } from "@/lib/prompts";
import type { QuizResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceText, wrongAnswers, missedConcepts } = body as {
      sourceText: string;
      wrongAnswers: QuizResult["wrongAnswers"];
      missedConcepts: string[];
    };

    if (!sourceText || !wrongAnswers || !missedConcepts) {
      return NextResponse.json(
        { error: "sourceText, wrongAnswers, and missedConcepts are required." },
        { status: 400 }
      );
    }

    const prompt = buildReviewPrompt(sourceText, wrongAnswers, missedConcepts);
    const reviewPack = await callClaude(prompt);

    return NextResponse.json(reviewPack);
  } catch (err) {
    console.error("[/api/review]", err);
    return NextResponse.json(
      { error: "Failed to generate review pack. Please try again." },
      { status: 500 }
    );
  }
}
