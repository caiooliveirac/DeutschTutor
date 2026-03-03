import { NextRequest, NextResponse } from "next/server";
import { resolveProviders, classifyProviderError } from "@/lib/ai/providers";
import { getSchreibenPrompt } from "@/lib/ai/prompts";
import { safeParseJSON, type SchreibenResponse } from "@/lib/ai/parsers";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rl = checkRateLimit("ai-schreiben", AI_RATE_LIMIT);
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
    const userText = body.userText as string | undefined;
    const taskInstruction = (body.taskInstruction as string) || "";
    const taskSituation = (body.taskSituation as string) || "";
    const taskPoints = (body.taskPoints as string[]) || [];
    const register = (body.register as "formal" | "informal") || "formal";
    const level = (body.level as string) || "B1";
    const providerId = body.provider as string | undefined;

    if (!userText || userText.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const systemPrompt = getSchreibenPrompt(level);
    const { quality: provider } = resolveProviders(providerId);

    const userPrompt = `Avalie o seguinte texto do aluno para a tarefa de Schreiben:

TAREFA:
- Instrução: ${taskInstruction}
- Situação: ${taskSituation}
- Pontos a abordar: ${taskPoints.join("; ")}
- Registro: ${register === "formal" ? "formal (Sie)" : "informal (du)"}

TEXTO DO ALUNO:
"""
${userText}
"""

Número de palavras: ${userText.split(/\s+/).filter(Boolean).length}`;

    const text = await provider.chat({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 4000,
    });

    const parsed = safeParseJSON<SchreibenResponse>(text);

    if (parsed) {
      return NextResponse.json({ ...parsed, _provider: provider.name });
    }

    return NextResponse.json(
      { error: "Failed to parse evaluation response" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Schreiben API error:", error);
    const { status, message } = classifyProviderError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
