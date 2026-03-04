/**
 * Provider Registry — auto-detects available AI providers from env vars.
 *
 * Adding a new provider:
 * 1. Create an adapter in src/lib/ai/providers/
 * 2. Add a ProviderConfig entry in PROVIDER_CATALOG below
 * 3. Set the env var in docker-compose.yml and .env
 */

import { AnthropicProvider } from "./anthropic";
import { createOpenAIProvider, createXAIProvider, createDeepSeekProvider } from "./openai-compat";
import { GoogleProvider } from "./google";
import type { AIProvider, ProviderConfig } from "./types";

// ── Provider catalog: all supported providers ──

const PROVIDER_CATALOG: ProviderConfig[] = [
  {
    id: "anthropic",
    name: "Anthropic Claude",
    tier: "premium",
    costRank: 5, // Most expensive (Opus 4.6: $15/$75 per Mtok)
    description: "Opus 4.6 para escrita/gramática, Sonnet 4.6 para chat rápido.",
    qualityModel: "claude-opus-4-6",
    qualityLabel: "Claude Opus 4.6",
    fastModel: "claude-sonnet-4-6",
    fastLabel: "Claude Sonnet 4.6",
    envVar: "ANTHROPIC_API_KEY",
    createQuality: () => new AnthropicProvider("claude-opus-4-6", "Claude Opus 4.6", "premium"),
    createFast: () => new AnthropicProvider("claude-sonnet-4-6", "Claude Sonnet 4.6", "premium"),
  },
  {
    id: "openai",
    name: "OpenAI",
    tier: "premium",
    costRank: 4, // Expensive (GPT-5.2)
    description: "GPT-5.2 para qualidade máxima, GPT-5 Mini para velocidade.",
    qualityModel: "gpt-5.2",
    qualityLabel: "GPT-5.2",
    fastModel: "gpt-5-mini",
    fastLabel: "GPT-5 Mini",
    envVar: "OPENAI_API_KEY",
    createQuality: () => createOpenAIProvider("gpt-5.2", "GPT-5.2", "premium"),
    createFast: () => createOpenAIProvider("gpt-5-mini", "GPT-5 Mini", "standard", { reasoning: true }),
  },
  {
    id: "google",
    name: "Google Gemini",
    tier: "premium",
    costRank: 2, // Cheap/free tier generous
    description: "Gemini 3.1 Pro para qualidade, Gemini 3 Flash para velocidade.",
    qualityModel: "gemini-3.1-pro-preview",
    qualityLabel: "Gemini 3.1 Pro",
    fastModel: "gemini-3-flash-preview",
    fastLabel: "Gemini 3 Flash",
    envVar: "GOOGLE_AI_KEY",
    createQuality: () => new GoogleProvider("gemini-3.1-pro-preview", "Gemini 3.1 Pro", "premium", { thinking: true }),
    createFast: () => new GoogleProvider("gemini-3-flash-preview", "Gemini 3 Flash", "standard"),
  },
  {
    id: "xai",
    name: "xAI Grok",
    tier: "standard",
    costRank: 3, // Mid-range
    description: "Grok 4 para qualidade, Grok 4.1 Fast para respostas rápidas.",
    qualityModel: "grok-4-0709",
    qualityLabel: "Grok 4",
    fastModel: "grok-4-1-fast-non-reasoning",
    fastLabel: "Grok 4.1 Fast",
    envVar: "XAI_API_KEY",
    createQuality: () => createXAIProvider("grok-4-0709", "Grok 4", "premium"),
    createFast: () => createXAIProvider("grok-4-1-fast-non-reasoning", "Grok 4.1 Fast", "standard"),
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    tier: "economy",
    costRank: 1, // Cheapest
    description: "DeepSeek R1 (raciocínio) para qualidade, V3 para velocidade.",
    qualityModel: "deepseek-reasoner",
    qualityLabel: "DeepSeek R1",
    fastModel: "deepseek-chat",
    fastLabel: "DeepSeek V3",
    envVar: "DEEPSEEK_API_KEY",
    createQuality: () => createDeepSeekProvider("deepseek-reasoner", "DeepSeek R1", "standard", { reasoning: true }),
    createFast: () => createDeepSeekProvider("deepseek-chat", "DeepSeek V3", "economy"),
  },
];

// ── Lazy singleton caches ──

const qualityCache = new Map<string, AIProvider>();
const fastCache = new Map<string, AIProvider>();

function getOrCreate(cache: Map<string, AIProvider>, id: string, factory: () => AIProvider): AIProvider {
  let instance = cache.get(id);
  if (!instance) {
    instance = factory();
    cache.set(id, instance);
  }
  return instance;
}

// ── Public API ──

/**
 * Get provider configs that have their API key set in the environment.
 */
export function getAvailableProviders(): ProviderConfig[] {
  return PROVIDER_CATALOG.filter((p) => !!process.env[p.envVar]);
}

/**
 * List available provider IDs (for the frontend provider picker).
 */
export function getAvailableProviderIds(): string[] {
  return getAvailableProviders().map((p) => p.id);
}

/**
 * Get a provider summary list for the frontend.
 */
export function getProviderList() {
  return getAvailableProviders().map((p) => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    description: p.description,
    qualityModel: p.qualityModel,
    qualityLabel: p.qualityLabel,
    fastModel: p.fastModel,
    fastLabel: p.fastLabel,
  }));
}

/**
 * Get the default provider ID (first available, preferring anthropic).
 */
export function getDefaultProviderId(): string {
  const available = getAvailableProviders();
  if (available.length === 0) {
    throw new Error("No AI providers configured. Set at least one API key (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)");
  }
  // Prefer anthropic, then whatever is first
  const anthropic = available.find((p) => p.id === "anthropic");
  return anthropic ? anthropic.id : available[0].id;
}

/**
 * Get a quality-tier provider instance by ID. Throws if unavailable.
 */
export function getQualityProvider(id?: string): AIProvider {
  const providerId = id || getDefaultProviderId();
  const config = PROVIDER_CATALOG.find((p) => p.id === providerId);
  if (!config) throw new Error(`Unknown provider: ${providerId}`);
  if (!process.env[config.envVar]) throw new Error(`Provider "${providerId}" not configured — set ${config.envVar}`);
  return getOrCreate(qualityCache, providerId, config.createQuality);
}

/**
 * Get a fast-tier provider instance by ID. Throws if unavailable.
 */
export function getFastProvider(id?: string): AIProvider {
  const providerId = id || getDefaultProviderId();
  const config = PROVIDER_CATALOG.find((p) => p.id === providerId);
  if (!config) throw new Error(`Unknown provider: ${providerId}`);
  if (!process.env[config.envVar]) throw new Error(`Provider "${providerId}" not configured — set ${config.envVar}`);
  return getOrCreate(fastCache, providerId, config.createFast);
}

/**
 * Resolve a provider from an optional request body field.
 * Returns { quality, fast } provider instances.
 */
export function resolveProviders(requestedId?: string): { quality: AIProvider; fast: AIProvider } {
  const id = requestedId && getAvailableProviderIds().includes(requestedId) ? requestedId : undefined;
  return {
    quality: getQualityProvider(id),
    fast: getFastProvider(id),
  };
}

/**
 * Get the ProviderConfig for a given provider ID. Returns undefined if not found.
 */
export function getProviderConfig(id: string): ProviderConfig | undefined {
  return PROVIDER_CATALOG.find((p) => p.id === id);
}
