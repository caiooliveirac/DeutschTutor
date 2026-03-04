import { NextRequest, NextResponse } from "next/server";
import { classifyProviderError } from "@/lib/ai/providers";
import { chatWithFallback } from "@/lib/ai/resilience";
import { getVocabPrompt } from "@/lib/ai/prompts";
import { safeParseJSON, sanitizeVocab } from "@/lib/ai/parsers";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";
import { getRecentVocabulary, getRecentErrors } from "@/lib/db/queries";
import { pickRandomTheme, pickExerciseTypes } from "@/lib/vocab-themes";

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
    const level = (body.level as string) || "B1";
    const providerId = body.provider as string | undefined;

    // ── Pull real data from DB for personalization ──
    const [recentVocab, recentErrors] = await Promise.all([
      getRecentVocabulary(50),
      getRecentErrors(20),
    ]);

    // Words already learned — exclude from new exercises
    const excludeWords = recentVocab.map((v) => v.wordDe);

    // Error patterns — focus exercises on weak areas
    const errorPatterns = recentErrors
      .filter((e) => !e.resolved)
      .map((e) => `${e.category}: ${e.originalText} → ${e.correctedText}`)
      .slice(0, 5);

    // ── Randomization: pick theme + exercise types ──
    // Track recently used themes via a simple in-memory window (per-request is fine,
    // the randomness of pickRandomTheme handles long-term distribution)
    const recentThemeIds = (body.recentThemes as string[]) || [];
    const theme = pickRandomTheme(recentThemeIds);
    const requiredTypes = pickExerciseTypes();
    const sessionSeed = Math.floor(Math.random() * 99999);

    const systemPrompt = getVocabPrompt({
      level,
      theme: { wortfeld: theme.wortfeld, context: theme.context, seedWords: theme.seedWords },
      requiredTypes,
      excludeWords: excludeWords.slice(0, 30), // Cap to avoid prompt bloat
      errorPatterns,
      sessionSeed,
    });

    const result = await chatWithFallback(providerId, "fast", {
      systemPrompt,
      messages: [
        {
          role: "user",
          content: `Sessão #${sessionSeed}. Wortfeld: ${theme.wortfeld}. Crie 5 exercícios NOVOS e ÚNICOS de vocabulário com word web. Tipos obrigatórios: ${requiredTypes.join(", ")}.`,
        },
      ],
      maxTokens: 3500,
      temperature: 0.9,
    });

    const meta = {
      _provider: result.providerName,
      _model: result.providerModel,
      _wasFallback: result.wasFallback,
      _fallbackReason: result.fallbackReason,
      _durationMs: result.durationMs,
    };

    const raw = safeParseJSON<Record<string, unknown>>(result.text);

    if (raw) {
      const parsed = sanitizeVocab(raw);
      // Guard: truncated JSON may parse OK but yield zero exercises
      if (parsed.exercises.length === 0) {
        console.warn(
          `[vocab] Parsed OK but 0 exercises. Provider: ${result.providerName}. ` +
            `Raw (${result.text.length} chars): ${result.text.slice(0, 300)}`,
        );
        return NextResponse.json(
          { error: "A IA gerou resposta incompleta. Tente novamente." },
          { status: 502 },
        );
      }
      return NextResponse.json({
        ...parsed,
        ...meta,
        _theme: { id: theme.id, label: theme.label, wortfeld: theme.wortfeld },
      });
    }

    console.error(
      `[vocab] safeParseJSON returned null. Provider: ${result.providerName}. ` +
      `Raw (${result.text.length} chars): ${result.text.slice(0, 500)}`
    );
    return NextResponse.json(
      { error: "Falha ao gerar exercícios. Tente novamente." },
      { status: 500 }
    );
  } catch (error) {
    console.error("Vocab API error:", error);
    const { status, message } = classifyProviderError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
