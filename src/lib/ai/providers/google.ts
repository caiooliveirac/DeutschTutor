import { GoogleGenAI } from "@google/genai";
import type { AIProvider, ChatParams, ProviderTier } from "./types";

/**
 * Google Gemini provider adapter.
 * Uses the @google/genai SDK (new unified SDK).
 */
/** Timeout for Google API calls (ms). SDK has no built-in timeout. */
const GOOGLE_TIMEOUT_MS = 120_000;

export class GoogleProvider implements AIProvider {
  readonly id = "google";
  readonly name: string;
  readonly tier: ProviderTier;
  readonly model: string;
  private client: GoogleGenAI;

  constructor(model: string, name: string, tier: ProviderTier) {
    const apiKey = process.env.GOOGLE_AI_KEY;
    if (!apiKey) throw new Error("GOOGLE_AI_KEY env var is required");

    this.model = model;
    this.name = name;
    this.tier = tier;
    this.client = new GoogleGenAI({ apiKey });
  }

  async chat(params: ChatParams): Promise<string> {
    // Build conversation history for Gemini multi-turn format
    const contents = params.messages.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    // Google SDK has no built-in timeout — enforce via AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GOOGLE_TIMEOUT_MS);

    // Google Gemini accepts temperature 0-2
    const temperature = params.temperature != null
      ? Math.min(params.temperature, 2)
      : undefined;

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents,
        config: {
          systemInstruction: params.systemPrompt,
          maxOutputTokens: params.maxTokens,
          abortSignal: controller.signal,
          ...(temperature != null ? { temperature } : {}),
        },
      });

      // Check for truncation via finishReason
      const candidate = response.candidates?.[0];
      if (candidate?.finishReason === "MAX_TOKENS") {
        console.warn(
          `[google] Response truncated (maxOutputTokens=${params.maxTokens}, model=${this.model})`
        );
      }

      return response.text ?? "";
    } catch (error) {
      if (controller.signal.aborted) {
        const timeoutError = new Error(`Timeout after ${GOOGLE_TIMEOUT_MS}ms (google/${this.model})`);
        (timeoutError as unknown as Record<string, unknown>).code = "ABORT_ERR";
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
