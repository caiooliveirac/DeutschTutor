import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL_FAST, classifyAIError } from "@/lib/ai/client";
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

    const claudeMessages = cappedMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await anthropic.messages.create({
      model: MODEL_FAST,
      max_tokens: 800,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = safeParseJSON<ConversationResponse>(text);

    if (parsed) {
      return NextResponse.json(parsed);
    }

    return NextResponse.json({
      ...getDefaultConversationResponse(),
      response: text || getDefaultConversationResponse().response,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const { status, message } = classifyAIError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
