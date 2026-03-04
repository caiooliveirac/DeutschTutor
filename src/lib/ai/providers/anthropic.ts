import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, ChatParams, ProviderTier } from "./types";

export class AnthropicProvider implements AIProvider {
  readonly id = "anthropic";
  readonly name: string;
  readonly tier: ProviderTier;
  readonly model: string;
  private client: Anthropic;

  constructor(model: string, name: string, tier: ProviderTier) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY env var is required");

    this.model = model;
    this.name = name;
    this.tier = tier;
    this.client = new Anthropic({
      apiKey,
      timeout: 120_000,
      maxRetries: 0, // resilience.ts handles retries
    });
  }

  async chat(params: ChatParams): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: params.maxTokens,
      ...(params.temperature != null ? { temperature: params.temperature } : {}),
      system: params.systemPrompt,
      messages: params.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    if (response.stop_reason === "max_tokens") {
      console.warn(
        `[anthropic] Response truncated (max_tokens=${params.maxTokens}, ` +
        `model=${this.model}, usage=${response.usage.input_tokens}in/${response.usage.output_tokens}out)`
      );
    }

    return response.content[0].type === "text" ? response.content[0].text : "";
  }
}
