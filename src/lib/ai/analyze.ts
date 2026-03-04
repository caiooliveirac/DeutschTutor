import { chatWithFallback } from "./resilience";
import { getAnalysisPrompt } from "./prompts";
import { safeParseJSON, getDefaultAnalysis, sanitizeAnalysis, type AnalysisResponse, type ProviderMeta } from "./parsers";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function analyzeMessage(
  userMessage: string,
  conversationContext: ChatMessage[],
  level: string = "B1",
  providerId?: string,
): Promise<AnalysisResponse & Partial<ProviderMeta>> {
  const systemPrompt = getAnalysisPrompt(level);

  const contextSummary =
    conversationContext.length > 0
      ? `\n\nContexto da conversa:\n${conversationContext
          .slice(-4)
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")}`
      : "";

  try {
    const result = await chatWithFallback(providerId, "fast", {
      systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analise esta mensagem do aluno: "${userMessage}"${contextSummary}`,
        },
      ],
      maxTokens: 4500, // Complex nested JSON: corrections[], surgery, vocab, challenge, signals
      temperature: 0.3, // Deterministic analysis — consistency matters
    });

    const meta: ProviderMeta = {
      _provider: result.providerName,
      _model: result.providerModel,
      _wasFallback: result.wasFallback,
      _fallbackReason: result.fallbackReason,
      _durationMs: result.durationMs,
    };

    const raw = safeParseJSON<Record<string, unknown>>(result.text);

    if (raw) {
      return { ...sanitizeAnalysis(raw, userMessage), ...meta };
    }

    // Parse failed — log raw text for debugging (truncate to 500 chars)
    console.error(
      `[analyze] safeParseJSON returned null. Provider: ${result.providerName}. ` +
      `Raw text (${result.text.length} chars): ${result.text.slice(0, 500)}${result.text.length > 500 ? '...' : ''}`
    );
    return { ...getDefaultAnalysis(userMessage), ...meta };
  } catch (error) {
    console.error("Analysis error:", error);
    return getDefaultAnalysis(userMessage);
  }
}
