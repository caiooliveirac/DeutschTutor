import OpenAI from "openai";
import type { AIProvider, ChatParams, ProviderTier } from "./types";

/**
 * OpenAI-compatible provider adapter.
 * Works with OpenAI, xAI (Grok), DeepSeek — all use the same API format.
 * Handles per-model constraints:
 *
 * | Constraint           | Standard models     | Reasoning models (o-series, GPT-5 Mini) |
 * |----------------------|---------------------|-----------------------------------------|
 * | System role           | "system"            | "developer" (OpenAI) or prepend to user  |
 * | Temperature           | 0-2 (OpenAI/xAI)   | NOT supported (400 error if sent)        |
 * | Token limit param     | max_tokens          | max_completion_tokens                    |
 *
 * Reference:
 * - OpenAI: https://platform.openai.com/docs/guides/reasoning
 * - xAI: https://docs.x.ai/docs — system role always supported
 * - DeepSeek: https://api-docs.deepseek.com — system role supported
 */
export class OpenAICompatProvider implements AIProvider {
  readonly id: string;
  readonly name: string;
  readonly tier: ProviderTier;
  readonly model: string;
  private client: OpenAI;
  private useMaxCompletionTokens: boolean;
  /**
   * Role name for the system/instruction message.
   * OpenAI reasoning models require "developer" instead of "system".
   * xAI and DeepSeek always use "system".
   */
  private systemRole: "system" | "developer";
  /**
   * Whether this model accepts the temperature parameter.
   * Reasoning models (o1, o3, gpt-5-mini) reject temperature != 1.
   */
  private supportsTemperature: boolean;

  constructor(opts: {
    id: string;
    model: string;
    name: string;
    tier: ProviderTier;
    apiKey: string;
    baseURL?: string;
    /** GPT-5.x and newer use max_completion_tokens instead of max_tokens */
    useMaxCompletionTokens?: boolean;
    /** Timeout in ms (default: 120s) */
    timeout?: number;
    /**
     * Role for system instructions.
     * - "system" (default): standard models
     * - "developer": OpenAI reasoning models (o-series, gpt-5-mini)
     */
    systemRole?: "system" | "developer";
    /**
     * Whether the model accepts temperature.
     * Set to false for reasoning models. Default: true.
     */
    supportsTemperature?: boolean;
  }) {
    this.id = opts.id;
    this.model = opts.model;
    this.name = opts.name;
    this.tier = opts.tier;
    this.useMaxCompletionTokens = opts.useMaxCompletionTokens ?? false;
    this.systemRole = opts.systemRole ?? "system";
    this.supportsTemperature = opts.supportsTemperature ?? true;
    this.client = new OpenAI({
      apiKey: opts.apiKey,
      baseURL: opts.baseURL,
      timeout: opts.timeout ?? 120_000,
      maxRetries: 0, // resilience.ts handles retries
    });
  }

  async chat(params: ChatParams): Promise<string> {
    // ── Token limit: max_completion_tokens for reasoning/GPT-5, max_tokens otherwise ──
    const tokenParam = this.useMaxCompletionTokens
      ? { max_completion_tokens: params.maxTokens }
      : { max_tokens: params.maxTokens };

    // ── Temperature: omit entirely for reasoning models (400 if sent) ──
    const tempParam = this.supportsTemperature && params.temperature != null
      ? { temperature: params.temperature }
      : {};

    // ── System message: "developer" for OpenAI reasoning, "system" for others ──
    const systemMessage = {
      role: this.systemRole as "system" | "developer",
      content: params.systemPrompt,
    };

    const response = await this.client.chat.completions.create({
      model: this.model,
      ...tokenParam,
      ...tempParam,
      messages: [
        systemMessage,
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

/** Options for per-model OpenAI constraints */
interface OpenAIModelOpts {
  /** True for reasoning models (o-series, gpt-5-mini) — uses developer role, no temperature */
  reasoning?: boolean;
}

export function createOpenAIProvider(model: string, name: string, tier: ProviderTier, opts?: OpenAIModelOpts): AIProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY env var is required");
  const isReasoning = opts?.reasoning ?? false;
  return new OpenAICompatProvider({
    id: "openai",
    model,
    name,
    tier,
    apiKey,
    useMaxCompletionTokens: true, // All GPT-5.x use max_completion_tokens
    systemRole: isReasoning ? "developer" : "system",
    supportsTemperature: !isReasoning,
  });
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

/** Options for per-model DeepSeek constraints */
interface DeepSeekModelOpts {
  /** True for deepseek-reasoner — no temperature support */
  reasoning?: boolean;
}

export function createDeepSeekProvider(model: string, name: string, tier: ProviderTier, opts?: DeepSeekModelOpts): AIProvider {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY env var is required");
  const isReasoning = opts?.reasoning ?? false;
  return new OpenAICompatProvider({
    id: "deepseek",
    model,
    name,
    tier,
    apiKey,
    baseURL: "https://api.deepseek.com",
    timeout: isReasoning ? 240_000 : 120_000,
    // DeepSeek uses standard system role for both models
    systemRole: "system",
    supportsTemperature: !isReasoning,
  });
}
