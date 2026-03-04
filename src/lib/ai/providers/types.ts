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
  /** Optional temperature (0-1). Higher = more creative/varied output. */
  temperature?: number;
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
  /**
   * Cost rank for fallback ordering (1 = cheapest, 5 = most expensive).
   * Fallback only goes to providers with costRank <= primary's costRank.
   */
  costRank: number;
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
 * Covers: rate limits, billing, network, timeout, content filtering, and generic errors.
 */
export function classifyProviderError(error: unknown): { status: number; message: string } {
  if (error && typeof error === "object") {
    const errorMessage = String((error as Record<string, unknown>).message || "");
    const errorCode = String((error as Record<string, unknown>).code || "");

    // ── Network / connectivity errors ──
    if (
      errorCode === "ECONNREFUSED" ||
      errorCode === "ECONNRESET" ||
      errorCode === "ENOTFOUND" ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "UND_ERR_CONNECT_TIMEOUT" ||
      errorCode === "EPIPE" ||
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("network") ||
      errorMessage.includes("socket hang up")
    ) {
      return { status: 503, message: "Erro de conexão com o serviço de IA. Verifique a rede." };
    }

    // ── Timeout (AbortController or custom) ──
    if (
      errorMessage.includes("Timeout") ||
      errorMessage.includes("timed out") ||
      errorMessage.includes("aborted") ||
      errorCode === "ABORT_ERR" ||
      (error instanceof DOMException && error.name === "AbortError")
    ) {
      return { status: 504, message: "A IA demorou demais para responder. Tente novamente." };
    }

    // ── Empty response ──
    if (errorMessage.includes("Empty response")) {
      return { status: 502, message: "A IA retornou resposta vazia. Tente novamente." };
    }

    // ── Credit/billing errors ──
    if (errorMessage.includes("credit balance") || errorMessage.includes("insufficient_quota")) {
      return { status: 402, message: "Créditos insuficientes no provedor de IA. Verifique sua conta." };
    }

    // ── Content filtering / safety ──
    if (
      errorMessage.includes("content_filter") ||
      errorMessage.includes("safety") ||
      errorMessage.includes("blocked") ||
      errorMessage.includes("HARM_CATEGORY") ||
      errorMessage.includes("RECITATION")
    ) {
      return { status: 451, message: "Conteúdo bloqueado pelo filtro de segurança da IA." };
    }

    if ("status" in error) {
      const status = (error as { status: number }).status;
      if (status === 429) return { status: 429, message: "Serviço de IA ocupado, tente novamente em breve." };
      if (status === 401) return { status: 500, message: "Chave de API inválida — verifique a configuração do servidor." };
      if (status === 400) {
        // Extract the real error detail from the provider response
        const detail = errorMessage.length > 10 ? ` (${errorMessage.slice(0, 120)})` : "";
        console.error(`[AI] 400 Bad Request${detail}`);
        return { status: 400, message: `Requisição inválida ao serviço de IA.${detail}` };
      }
      if (status === 529 || status === 503) return { status: 503, message: "Serviço de IA sobrecarregado, tente mais tarde." };
      if (status === 404) return { status: 500, message: "Modelo de IA não encontrado — pode estar deprecado." };
    }

    // ── OpenAI-style error codes ──
    if ("code" in error) {
      if (errorCode === "model_not_found") return { status: 500, message: "Modelo de IA não encontrado. Verifique a configuração." };
      if (errorCode === "rate_limit_exceeded") return { status: 429, message: "Limite de chamadas atingido, tente em breve." };
      if (errorCode === "context_length_exceeded") return { status: 400, message: "Mensagem longa demais para o modelo." };
    }
  }
  return { status: 500, message: "Falha ao gerar resposta da IA." };
}

/**
 * Whether an HTTP status from classifyProviderError is retryable
 * (i.e., might succeed on retry or with a different provider).
 */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}
