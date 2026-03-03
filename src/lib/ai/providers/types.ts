/**
 * AIProvider interface — the contract every AI provider must implement.
 *
 * All providers receive the SAME prompts and must return the SAME JSON format.
 * The prompts are provider-agnostic (defined in src/lib/ai/prompts.ts).
 */

export type ProviderTier = "premium" | "standard" | "economy";

export interface ChatParams {
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens: number;
}

export interface AIProvider {
  /** Unique identifier: "anthropic", "openai", "google", "xai", "deepseek" */
  readonly id: string;

  /** Human-friendly name: "Claude Sonnet 4", "GPT-4o", etc. */
  readonly name: string;

  /** Cost tier for UI display */
  readonly tier: ProviderTier;

  /** Model identifier sent to the API */
  readonly model: string;

  /**
   * Send a chat completion request and return the raw text response.
   * The caller handles JSON parsing via safeParseJSON().
   */
  chat(params: ChatParams): Promise<string>;
}

/** Provider configuration stored in the registry */
export interface ProviderConfig {
  id: string;
  name: string;
  tier: ProviderTier;
  /** Short description for UI tooltip */
  description: string;
  /** The model used for quality endpoints (schreiben, grammatik) */
  qualityModel: string;
  /** Human-friendly label for the quality model */
  qualityLabel: string;
  /** The model used for fast endpoints (chat, analyze, vocab) */
  fastModel: string;
  /** Human-friendly label for the fast model */
  fastLabel: string;
  /** The env var that holds the API key */
  envVar: string;
  /** Factory function */
  createQuality: () => AIProvider;
  createFast: () => AIProvider;
}

/**
 * Classify provider errors into HTTP status + user-facing message.
 * This generalizes the Anthropic-specific error classifier.
 */
export function classifyProviderError(error: unknown): { status: number; message: string } {
  if (error && typeof error === "object") {
    const errorMessage = String((error as Record<string, unknown>).message || "");

    // Credit/billing errors
    if (errorMessage.includes("credit balance") || errorMessage.includes("insufficient_quota")) {
      return { status: 402, message: "Créditos insuficientes no provedor de IA. Verifique sua conta." };
    }

    if ("status" in error) {
      const status = (error as { status: number }).status;
      if (status === 429) return { status: 429, message: "Serviço de IA ocupado, tente novamente em breve." };
      if (status === 401) return { status: 500, message: "Chave de API inválida — verifique a configuração do servidor." };
      if (status === 400) return { status: 400, message: "Requisição inválida ao serviço de IA." };
      if (status === 529 || status === 503) return { status: 503, message: "Serviço de IA sobrecarregado, tente mais tarde." };
      if (status === 404) return { status: 500, message: "Modelo de IA não encontrado — pode estar deprecado." };
    }

    // OpenAI-style error codes
    if ("code" in error) {
      const code = (error as { code: string }).code;
      if (code === "model_not_found") return { status: 500, message: "Modelo de IA não encontrado. Verifique a configuração." };
      if (code === "rate_limit_exceeded") return { status: 429, message: "Limite de chamadas atingido, tente em breve." };
    }
  }
  return { status: 500, message: "Falha ao gerar resposta da IA." };
}
