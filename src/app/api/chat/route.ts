import { NextRequest, NextResponse } from "next/server";
import { resolveProviders, classifyProviderError } from "@/lib/ai/providers";
import { getConversationPrompt } from "@/lib/ai/prompts";
import { safeParseJSON, getDefaultConversationResponse, type ConversationResponse } from "@/lib/ai/parsers";
import { getScenarioById } from "@/lib/scenarios";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit
  const rl = checkRateLimit("ai-chat", AI_RATE_LIMIT);
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
    const messages = body.messages as { role: "user" | "assistant"; content: string }[] | undefined;
    const scenarioId = (body.scenarioId as string) || "frei";
    const level = (body.level as string) || "B1";
    const providerId = body.provider as string | undefined;

    // Input validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages must be a non-empty array" }, { status: 400 });
    }
    // Cap at last 20 messages to prevent excessive token usage
    const cappedMessages = messages.slice(-20);
    for (const m of cappedMessages) {
      if (!m.role || !m.content || !["user", "assistant"].includes(m.role)) {
        return NextResponse.json({ error: "Each message must have role (user|assistant) and content" }, { status: 400 });
      }
    }

    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    const systemPrompt = getConversationPrompt(scenario, level);
    const { fast: provider } = resolveProviders(providerId);

    const text = await provider.chat({
      systemPrompt,
      messages: cappedMessages,
      maxTokens: 800,
    });

    const parsed = safeParseJSON<ConversationResponse>(text);

    if (parsed) {
      return NextResponse.json({ ...parsed, _provider: provider.name });
    }

    return NextResponse.json({
      ...getDefaultConversationResponse(),
      response: text || getDefaultConversationResponse().response,
      _provider: provider.name,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const { status, message } = classifyProviderError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
