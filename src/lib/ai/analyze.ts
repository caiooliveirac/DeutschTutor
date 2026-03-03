import { resolveProviders } from "./providers";
import { getAnalysisPrompt } from "./prompts";
import { safeParseJSON, getDefaultAnalysis, type AnalysisResponse } from "./parsers";

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
      maxTokens: 2000,
    });

    const parsed = safeParseJSON<AnalysisResponse>(text);

    if (parsed) {
      return parsed;
    }

    return getDefaultAnalysis(userMessage);
  } catch (error) {
    console.error("Analysis error:", error);
    return getDefaultAnalysis(userMessage);
  }
}
