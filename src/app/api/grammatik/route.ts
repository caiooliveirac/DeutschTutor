import { NextRequest, NextResponse } from "next/server";
import { resolveProviders, classifyProviderError } from "@/lib/ai/providers";
import { getGrammatikPrompt } from "@/lib/ai/prompts";
import { safeParseJSON, type GrammatikResponse } from "@/lib/ai/parsers";
import { getGrammarTopicById } from "@/lib/grammar-topics";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rl = checkRateLimit("ai-grammatik", AI_RATE_LIMIT);
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

    const systemPrompt = getGrammatikPrompt(topic, level);
    const { quality: provider } = resolveProviders(providerId);

    const text = await provider.chat({
      systemPrompt,
      messages: [
        {
          role: "user",
          content: `Crie a aula completa sobre "${topic.title}" com exercícios progressivos.`,
        },
      ],
      maxTokens: 3000,
    });

    const parsed = safeParseJSON<GrammatikResponse>(text);

    if (parsed) {
      return NextResponse.json({ ...parsed, _provider: provider.name });
    }

    return NextResponse.json(
      { error: "Failed to parse grammar response" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Grammatik API error:", error);
    const { status, message } = classifyProviderError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
