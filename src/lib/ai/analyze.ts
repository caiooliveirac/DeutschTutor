import { anthropic, MODEL_FAST } from "./client";
import { getAnalysisPrompt } from "./prompts";
import { safeParseJSON, getDefaultAnalysis, type AnalysisResponse } from "./parsers";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function analyzeMessage(
  userMessage: string,
  conversationContext: ChatMessage[],
  level: string = "B1"
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
    const response = await anthropic.messages.create({
      model: MODEL_FAST,
      max_tokens: 1200,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analise esta mensagem do aluno: "${userMessage}"${contextSummary}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
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
