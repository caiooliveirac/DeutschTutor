import { NextRequest, NextResponse } from "next/server";
import { analyzeMessage, type ChatMessage } from "@/lib/ai/analyze";
import { classifyAIError } from "@/lib/ai/client";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rl = checkRateLimit("ai-analyze", AI_RATE_LIMIT);
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
    const message = body.message as string | undefined;
    const conversationContext = (body.conversationContext ?? []) as ChatMessage[];
    const level = (body.level as string) || "B1";

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const analysis = await analyzeMessage(message, conversationContext, level);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analyze API error:", error);
    const { status, message } = classifyAIError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
