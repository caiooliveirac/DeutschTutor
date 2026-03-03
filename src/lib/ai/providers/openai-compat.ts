import OpenAI from "openai";
import type { AIProvider, ChatParams, ProviderTier } from "./types";

/**
 * OpenAI-compatible provider adapter.
 * Works with OpenAI, xAI (Grok), DeepSeek — all use the same API format.
 * Just change baseURL and apiKey.
 */
export class OpenAICompatProvider implements AIProvider {
  readonly id: string;
  readonly name: string;
  readonly tier: ProviderTier;
  readonly model: string;
  private client: OpenAI;
  private useMaxCompletionTokens: boolean;

  constructor(opts: {
    id: string;
    model: string;
    name: string;
    tier: ProviderTier;
    apiKey: string;
    baseURL?: string;
    /** GPT-5.x and newer use max_completion_tokens instead of max_tokens */
    useMaxCompletionTokens?: boolean;
    /** Timeout in ms (default: 60s) */
    timeout?: number;
  }) {
    this.id = opts.id;
    this.model = opts.model;
    this.name = opts.name;
    this.tier = opts.tier;
    this.useMaxCompletionTokens = opts.useMaxCompletionTokens ?? false;
    this.client = new OpenAI({
      apiKey: opts.apiKey,
      baseURL: opts.baseURL,
      timeout: opts.timeout ?? 120_000,
      maxRetries: 2,
    });
  }

  async chat(params: ChatParams): Promise<string> {
    const tokenParam = this.useMaxCompletionTokens
      ? { max_completion_tokens: params.maxTokens }
      : { max_tokens: params.maxTokens };

    const response = await this.client.chat.completions.create({
      model: this.model,
      ...tokenParam,
      messages: [
        { role: "system" as const, content: params.systemPrompt },
        ...params.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const choice = response.choices[0];
    if (choice?.finish_reason === "length") {
      console.warn(
        `[${this.id}] Response truncated (max_tokens=${params.maxTokens}, model=${this.model})`
      );
    }

    return choice?.message?.content ?? "";
  }
}

// ── Factory functions for each OpenAI-compatible provider ──

export function createOpenAIProvider(model: string, name: string, tier: ProviderTier): AIProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY env var is required");
  return new OpenAICompatProvider({ id: "openai", model, name, tier, apiKey, useMaxCompletionTokens: true });
}

export function createXAIProvider(model: string, name: string, tier: ProviderTier): AIProvider {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY env var is required");
  return new OpenAICompatProvider({
    id: "xai",
    model,
    name,
    tier,
    apiKey,
    baseURL: "https://api.x.ai/v1",
  });
}

export function createDeepSeekProvider(model: string, name: string, tier: ProviderTier): AIProvider {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY env var is required");
  return new OpenAICompatProvider({
    id: "deepseek",
    model,
    name,
    tier,
    apiKey,
    baseURL: "https://api.deepseek.com",
    timeout: 240_000, // R1 reasoning model needs more time
  });
}
