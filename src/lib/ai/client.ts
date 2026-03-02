import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    "ANTHROPIC_API_KEY environment variable is required. Add it to .env.local"
  );
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30_000, // 30s timeout
  maxRetries: 2,   // retry on transient errors
});

export { anthropic };

/** High-quality model — used for Schreiben evaluation & Grammar lessons */
export const MODEL = "claude-sonnet-4-20250514";

/** Fast & cheap model — used for chat conversation & analysis (~20x cheaper output) */
export const MODEL_FAST = "claude-haiku-3-5-20241022";

/**
 * Classify an Anthropic SDK error into an HTTP status + user-friendly message.
 */
export function classifyAIError(error: unknown): { status: number; message: string } {
  if (error && typeof error === "object") {
    // Check for credit balance error (comes as status 400 from Anthropic)
    const errorMessage = String((error as Record<string, unknown>).message || "");
    if (errorMessage.includes("credit balance")) {
      return { status: 402, message: "Créditos Anthropic insuficientes. Acesse console.anthropic.com para recarregar." };
    }

    if ("status" in error) {
      const status = (error as { status: number }).status;
      if (status === 429) return { status: 429, message: "AI service busy, try again shortly" };
      if (status === 401) return { status: 500, message: "Invalid API key — check server configuration" };
      if (status === 400) return { status: 400, message: "Invalid request to AI service" };
      if (status === 529) return { status: 503, message: "AI service overloaded, try again later" };
    }
  }
  return { status: 500, message: "Failed to generate AI response" };
}
