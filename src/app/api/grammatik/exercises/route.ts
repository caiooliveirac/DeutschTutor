import { NextRequest, NextResponse } from "next/server";
import { classifyProviderError } from "@/lib/ai/providers";
import { chatWithFallback } from "@/lib/ai/resilience";
import { getGrammatikExercisePrompt } from "@/lib/ai/prompts";
import { safeParseJSON, sanitizeGrammatikExercises } from "@/lib/ai/parsers";
import { getGrammarTopicById } from "@/lib/grammar-topics";
import { getGrammarErrorPatterns } from "@/lib/db/queries";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rl = checkRateLimit("ai-grammatik-ex", AI_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const topicId = body.topicId as string | undefined;
    const level = (body.level as string) || "B1";
    const providerId = body.provider as string | undefined;

    if (!topicId) {
      return NextResponse.json({ error: "topicId is required" }, { status: 400 });
    }

    const topic = getGrammarTopicById(topicId);
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Fetch student's recent grammar error patterns for personalization
    const errorPatterns = await getGrammarErrorPatterns(8);

    const systemPrompt = getGrammatikExercisePrompt(topic, level, errorPatterns);

    const { text, providerName } = await chatWithFallback(providerId, "quality", {
      systemPrompt,
      messages: [
        {
          role: "user",
          content: `Gere 8 exercícios progressivos sobre "${topic.title}". Seed: ${Date.now()}`,
        },
      ],
      maxTokens: 3500,
    });

    const raw = safeParseJSON<Record<string, unknown>>(text);

    if (raw) {
      const parsed = sanitizeGrammatikExercises(raw);
      return NextResponse.json({ ...parsed, _provider: providerName });
    }

    console.error(
      `[grammatik/exercises] safeParseJSON returned null. Provider: ${providerName}. ` +
        `Raw (${text.length} chars): ${text.slice(0, 500)}`,
    );
    return NextResponse.json(
      { error: "Falha ao gerar exercícios. Tente novamente." },
      { status: 500 },
    );
  } catch (error) {
    console.error("Grammatik exercises API error:", error);
    const { status, message } = classifyProviderError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
