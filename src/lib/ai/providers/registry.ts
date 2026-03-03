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
    qualityModel: "claude-sonnet-4-20250514",
    fastModel: "claude-sonnet-4-20250514",
    envVar: "ANTHROPIC_API_KEY",
    createQuality: () => new AnthropicProvider("claude-sonnet-4-20250514", "Claude Sonnet 4", "premium"),
    createFast: () => new AnthropicProvider("claude-sonnet-4-20250514", "Claude Sonnet 4 (Fast)", "premium"),
  },
  {
    id: "openai",
    name: "OpenAI",
    tier: "premium",
    qualityModel: "gpt-4o",
    fastModel: "gpt-4o-mini",
    envVar: "OPENAI_API_KEY",
    createQuality: () => createOpenAIProvider("gpt-4o", "GPT-4o", "premium"),
    createFast: () => createOpenAIProvider("gpt-4o-mini", "GPT-4o Mini", "standard"),
  },
  {
    id: "google",
    name: "Google Gemini",
    tier: "premium",
    qualityModel: "gemini-2.5-pro",
    fastModel: "gemini-2.5-flash",
    envVar: "GOOGLE_AI_KEY",
    createQuality: () => new GoogleProvider("gemini-2.5-pro", "Gemini 2.5 Pro", "premium"),
    createFast: () => new GoogleProvider("gemini-2.5-flash", "Gemini 2.5 Flash", "standard"),
  },
  {
    id: "xai",
    name: "xAI Grok",
    tier: "standard",
    qualityModel: "grok-3",
    fastModel: "grok-3-mini",
    envVar: "XAI_API_KEY",
    createQuality: () => createXAIProvider("grok-3", "Grok 3", "standard"),
    createFast: () => createXAIProvider("grok-3-mini", "Grok 3 Mini", "economy"),
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    tier: "economy",
    qualityModel: "deepseek-chat",
    fastModel: "deepseek-chat",
    envVar: "DEEPSEEK_API_KEY",
    createQuality: () => createDeepSeekProvider("deepseek-chat", "DeepSeek V3", "economy"),
    createFast: () => createDeepSeekProvider("deepseek-chat", "DeepSeek V3 (Fast)", "economy"),
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
export function getProviderList(): { id: string; name: string; tier: string; qualityModel: string; fastModel: string }[] {
  return getAvailableProviders().map((p) => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    qualityModel: p.qualityModel,
    fastModel: p.fastModel,
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
