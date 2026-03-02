import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL, classifyAIError } from "@/lib/ai/client";
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

    if (!topicId) {
      return NextResponse.json({ error: "topicId is required" }, { status: 400 });
    }

    const topic = getGrammarTopicById(topicId);
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const systemPrompt = getGrammatikPrompt(topic, level);

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Crie a aula completa sobre "${topic.title}" com exercícios progressivos.`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = safeParseJSON<GrammatikResponse>(text);

    if (parsed) {
      return NextResponse.json(parsed);
    }

    return NextResponse.json(
      { error: "Failed to parse grammar response" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Grammatik API error:", error);
    const { status, message } = classifyAIError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
