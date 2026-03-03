import { resolveProviders } from "./providers";
import { getAnalysisPrompt } from "./prompts";
import { safeParseJSON, getDefaultAnalysis, sanitizeAnalysis, type AnalysisResponse } from "./parsers";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function analyzeMessage(
  userMessage: string,
  conversationContext: ChatMessage[],
  level: string = "B1",
  providerId?: string,
): Promise<AnalysisResponse> {
  const systemPrompt = getAnalysisPrompt(level);

  const contextSummary =
    conversationContext.length > 0
      ? `\n\nContexto da conversa:\n${conversationContext
          .slice(-4)
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")}`
      : "";

  try {
    const { fast: provider } = resolveProviders(providerId);

    const text = await provider.chat({
      systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analise esta mensagem do aluno: "${userMessage}"${contextSummary}`,
        },
      ],
      maxTokens: 3000,
    });

    const raw = safeParseJSON<Record<string, unknown>>(text);

    if (raw) {
      return sanitizeAnalysis(raw, userMessage);
    }

    // Parse failed — log raw text for debugging (truncate to 500 chars)
    console.error(
      `[analyze] safeParseJSON returned null. Provider: ${provider.id}/${provider.model}. ` +
      `Raw text (${text.length} chars): ${text.slice(0, 500)}${text.length > 500 ? '...' : ''}`
    );
    return getDefaultAnalysis(userMessage);
  } catch (error) {
    console.error("Analysis error:", error);
    return getDefaultAnalysis(userMessage);
  }
}
