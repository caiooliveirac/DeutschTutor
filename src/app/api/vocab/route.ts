import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL_FAST, classifyAIError } from "@/lib/ai/client";
import { getVocabPrompt } from "@/lib/ai/prompts";
import { safeParseJSON, type VocabResponse } from "@/lib/ai/parsers";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rl = checkRateLimit("ai-vocab", AI_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const recentWords = (body.recentWords as string[]) || [];
    const errorPatterns = (body.errorPatterns as string[]) || [];
    const level = (body.level as string) || "B1";

    const systemPrompt = getVocabPrompt(
      recentWords.length > 0 ? recentWords : ["lernen", "sprechen", "verstehen", "arbeiten", "helfen"],
      errorPatterns.length > 0 ? errorPatterns : ["Artikelfehler", "Wortstellung"],
      level
    );

    const response = await anthropic.messages.create({
      model: MODEL_FAST,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: "Crie 5 exercícios variados de vocabulário focados em produção ativa, com um word web.",
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = safeParseJSON<VocabResponse>(text);

    if (parsed) {
      return NextResponse.json(parsed);
    }

    return NextResponse.json(
      { error: "Failed to parse vocab response" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Vocab API error:", error);
    const { status, message } = classifyAIError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
