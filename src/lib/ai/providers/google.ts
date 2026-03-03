import { GoogleGenAI } from "@google/genai";
import type { AIProvider, ChatParams, ProviderTier } from "./types";

/**
 * Google Gemini provider adapter.
 * Uses the @google/genai SDK (new unified SDK).
 */
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

    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction: params.systemPrompt,
        maxOutputTokens: params.maxTokens,
      },
    });

    return response.text ?? "";
  }
}
