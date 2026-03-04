/**
 * Resilient AI call wrapper — smart retry + cost-conscious fallback.
 *
 * Key principles:
 * 1. NEVER fall back to a MORE EXPENSIVE provider. A 429 on Gemini Flash must
 *    NOT cascade into a $75/Mtok Opus call.
 * 2. Track per-provider cooldowns so we don't hammer a rate-limited provider.
 * 3. Retry the PRIMARY once (with backoff). Only then consider fallback.
 * 4. Fallback candidates are filtered by costRank <= primary's costRank,
 *    sorted cheapest-first, and limited to 1 attempt max.
 * 5. Non-retryable errors (400, 402, 451) never trigger retry or fallback.
 */

import type { AIProvider, ChatParams } from "./providers/types";
import { classifyProviderError, isRetryableStatus } from "./providers/types";
import {
  getAvailableProviders,
  getQualityProvider,
  getFastProvider,
  getProviderConfig,
} from "./providers/registry";

// ── Provider cooldown tracker ──
// When a provider hits 429/503, we record a cooldown. During cooldown,
// we skip that provider for fallback selection.

interface CooldownEntry {
  until: number; // timestamp ms
  reason: string;
}

const providerCooldowns = new Map<string, CooldownEntry>();

/** Default cooldown: 60 seconds after a 429 */
const COOLDOWN_429_MS = 60_000;
/** Default cooldown: 30 seconds after a 503/502 */
const COOLDOWN_5XX_MS = 30_000;
/** Delay before retrying the same provider */
const RETRY_DELAY_MS = 2_000;

function setCooldown(providerId: string, status: number, message: string): void {
  const duration = status === 429 ? COOLDOWN_429_MS : COOLDOWN_5XX_MS;
  const until = Date.now() + duration;
  providerCooldowns.set(providerId, { until, reason: message });
  console.warn(
    `[resilience] ${providerId} in cooldown for ${duration / 1000}s (${status}: ${message})`
  );
}

function isInCooldown(providerId: string): boolean {
  const entry = providerCooldowns.get(providerId);
  if (!entry) return false;
  if (Date.now() > entry.until) {
    providerCooldowns.delete(providerId);
    return false;
  }
  return true;
}

/** Exposed for diagnostics: get all active cooldowns */
export function getActiveCooldowns(): Record<string, { until: number; reason: string }> {
  const now = Date.now();
  const result: Record<string, { until: number; reason: string }> = {};
  for (const [id, entry] of providerCooldowns) {
    if (now < entry.until) {
      result[id] = entry;
    } else {
      providerCooldowns.delete(id);
    }
  }
  return result;
}

// ── TPM (Tokens Per Minute) guard ──
// Estimates token usage per provider on a rolling 60-second window.
// When usage approaches the provider's TPM limit, proactively routes
// to a fallback BEFORE hitting a 429 — preventing wasted latency.
// Override limits via env: GOOGLE_TPM_LIMIT=1000000

interface TPMRecord {
  tokens: number;
  ts: number;
}

const tpmLedger = new Map<string, TPMRecord[]>();

/**
 * Get TPM limit for a provider.
 * Check env first (e.g., GOOGLE_TPM_LIMIT=1000000), then fall back to defaults.
 */
function getTPMLimit(providerId: string): number | null {
  const envVal = process.env[`${providerId.toUpperCase()}_TPM_LIMIT`];
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (parsed > 0) return parsed;
  }
  // Conservative defaults — only providers with known tight free-tier limits.
  // Google: Flash ~1M TPM, Pro ~32K on free tier. 250K is a safe middle ground.
  // Paid plans: set GOOGLE_TPM_LIMIT=4000000 in .env
  const defaults: Record<string, number> = {
    google: 250_000,
  };
  return defaults[providerId] ?? null;
}

/** Estimate input tokens from prompt + messages (~3.5 chars/token for DE/PT) */
function estimateInputTokens(params: ChatParams): number {
  const chars = params.systemPrompt.length +
    params.messages.reduce((sum, m) => sum + m.content.length, 0);
  return Math.ceil(chars / 3.5);
}

/** Estimate total tokens: input + expected output (~60% of maxTokens budget) */
function estimateRequestTokens(params: ChatParams): number {
  return estimateInputTokens(params) + Math.ceil(params.maxTokens * 0.6);
}

/** Record actual token usage after a successful response */
function recordTokenUsage(providerId: string, inputTokens: number, outputText: string): void {
  const outputTokens = Math.ceil(outputText.length / 3.5);
  const now = Date.now();
  const records = (tpmLedger.get(providerId) ?? []).filter(r => now - r.ts < 60_000);
  records.push({ tokens: inputTokens + outputTokens, ts: now });
  tpmLedger.set(providerId, records);
}

/** Get rolling TPM for a provider */
function currentTPM(providerId: string): number {
  const now = Date.now();
  return (tpmLedger.get(providerId) ?? [])
    .filter(r => now - r.ts < 60_000)
    .reduce((sum, r) => sum + r.tokens, 0);
}

/** Check if adding tokens would exceed 80% of the provider's TPM limit */
function wouldExceedTPM(providerId: string, estimatedTokens: number): boolean {
  const limit = getTPMLimit(providerId);
  if (!limit) return false;
  const current = currentTPM(providerId);
  if (current + estimatedTokens > limit * 0.8) {
    console.warn(
      `[tpm] ${providerId}: ${current}+${estimatedTokens}=${current + estimatedTokens} ` +
      `would exceed 80% of ${limit} TPM limit. Pre-emptive skip.`
    );
    return true;
  }
  return false;
}

/** Exposed for diagnostics: current TPM usage per provider */
export function getActiveTPM(): Record<string, { current: number; limit: number | null }> {
  const result: Record<string, { current: number; limit: number | null }> = {};
  for (const id of tpmLedger.keys()) {
    result[id] = { current: currentTPM(id), limit: getTPMLimit(id) };
  }
  return result;
}

// ── Main interface ──

export interface ResilientChatResult {
  /** Raw text response from the provider */
  text: string;
  /** Human-friendly provider name */
  providerName: string;
  /** Whether a fallback provider was used instead of the requested one */
  wasFallback: boolean;
  /** If fallback was used, explain why */
  fallbackReason?: string;
}

/**
 * Send a chat completion with smart retry + cost-conscious fallback.
 *
 * @param providerId - User's preferred provider ID (e.g., "google")
 * @param tier       - "quality" or "fast"
 * @param params     - Chat completion parameters
 */
export async function chatWithFallback(
  providerId: string | undefined,
  tier: "quality" | "fast",
  params: ChatParams,
): Promise<ResilientChatResult> {
  const getProvider = tier === "quality" ? getQualityProvider : getFastProvider;
  const primary = getProvider(providerId);
  const primaryConfig = getProviderConfig(primary.id);
  const primaryCostRank = primaryConfig?.costRank ?? 5;
  const estimatedTokens = estimateRequestTokens(params);
  const inputTokens = estimateInputTokens(params);

  // ── 0. Pre-flight TPM check ──
  if (wouldExceedTPM(primary.id, estimatedTokens)) {
    const fallbackResult = await tryFallbacks(primary.id, primaryCostRank, tier, params, getProvider);
    if (fallbackResult) return fallbackResult;
    console.warn(`[resilience] No fallback for TPM limit, proceeding with ${primary.id}`);
  }

  // ── 1. Check if primary is in cooldown ──
  if (isInCooldown(primary.id)) {
    console.warn(`[resilience] ${primary.id} is in cooldown, skipping to fallback`);
    // Go straight to fallback
    const fallbackResult = await tryFallbacks(primary.id, primaryCostRank, tier, params, getProvider);
    if (fallbackResult) return fallbackResult;
    // No fallback available — try primary anyway (cooldown is advisory)
  }

  // ── 2. Try primary provider ──
  const primaryResult = await tryProvider(primary, params);
  if (primaryResult.ok) {
    recordTokenUsage(primary.id, inputTokens, primaryResult.text);
    return { text: primaryResult.text, providerName: primary.name, wasFallback: false };
  }

  // ── 3. Classify the error ──
  const classified = classifyProviderError(primaryResult.error);

  // Non-retryable AND non-fallbackable: fail immediately (e.g., 402 billing, 451 safety).
  // 400 errors: skip retry (same params will fail) but DO try fallback — a different
  // provider may handle the same request fine (e.g., parameter compatibility differences).
  if (classified.status === 400) {
    console.warn(
      `[resilience] ${primary.id}/${primary.model} → 400: ${classified.message}. ` +
      `Skipping retry, trying fallback...`
    );
    const fallbackResult = await tryFallbacks(primary.id, primaryCostRank, tier, params, getProvider);
    if (fallbackResult) return fallbackResult;
    throw primaryResult.error;
  }

  if (!isRetryableStatus(classified.status)) {
    throw primaryResult.error;
  }

  // Record cooldown so subsequent requests skip this provider
  setCooldown(primary.id, classified.status, classified.message);

  // ── 4. Retry primary once after short delay ──
  console.warn(
    `[resilience] ${primary.id}/${primary.model} → ${classified.status}: ${classified.message}. ` +
    `Retrying in ${RETRY_DELAY_MS}ms...`
  );
  await sleep(RETRY_DELAY_MS);

  const retryResult = await tryProvider(primary, params);
  if (retryResult.ok) {
    // It worked on retry — clear cooldown
    providerCooldowns.delete(primary.id);
    recordTokenUsage(primary.id, inputTokens, retryResult.text);
    return { text: retryResult.text, providerName: primary.name, wasFallback: false };
  }

  // ── 5. Try ONE fallback (cost-aware, cheapest-first) ──
  const fallbackResult = await tryFallbacks(primary.id, primaryCostRank, tier, params, getProvider);
  if (fallbackResult) return fallbackResult;

  // ── 6. All options exhausted ──
  console.error(
    `[resilience] All options exhausted for ${primary.id}. ` +
    `No available fallback with costRank <= ${primaryCostRank}.`
  );
  throw primaryResult.error;
}

// ── Internal helpers ──

/**
 * Try fallback providers: only same-or-cheaper cost, not in cooldown,
 * not exceeding TPM, sorted cheapest-first. Tries up to 2 candidates.
 */
async function tryFallbacks(
  primaryId: string,
  primaryCostRank: number,
  tier: "quality" | "fast",
  params: ChatParams,
  getProvider: (id?: string) => AIProvider,
): Promise<ResilientChatResult | null> {
  const available = getAvailableProviders();
  const estimated = estimateRequestTokens(params);
  const inputTokens = estimateInputTokens(params);

  // Filter: not primary, not in cooldown, costRank <= primary's, TPM OK
  const candidates = available
    .filter((c) =>
      c.id !== primaryId &&
      !isInCooldown(c.id) &&
      c.costRank <= primaryCostRank &&
      !wouldExceedTPM(c.id, estimated)
    )
    .sort((a, b) => a.costRank - b.costRank); // cheapest first

  if (candidates.length === 0) {
    console.warn(
      `[resilience] No fallback candidates (costRank <= ${primaryCostRank}, not in cooldown, TPM OK)`
    );
    return null;
  }

  // Try up to 2 cheapest candidates
  for (const candidate of candidates.slice(0, 2)) {
    try {
      const fb = getProvider(candidate.id);
      console.warn(
        `[resilience] Trying fallback: ${fb.id}/${fb.model} (costRank=${candidate.costRank})`
      );

      const fbResult = await tryProvider(fb, params);
      if (fbResult.ok) {
        console.info(`[resilience] Fallback ${fb.id} succeeded.`);
        recordTokenUsage(fb.id, inputTokens, fbResult.text);
        return {
          text: fbResult.text,
          providerName: fb.name,
          wasFallback: true,
          fallbackReason: `${primaryId} indisponível temporariamente`,
        };
      }

      // Fallback also failed — set cooldown on it too
      const fbClassified = classifyProviderError(fbResult.error);
      if (isRetryableStatus(fbClassified.status)) {
        setCooldown(fb.id, fbClassified.status, fbClassified.message);
      }
      console.warn(`[resilience] Fallback ${fb.id} also failed: ${fbClassified.message}`);
    } catch (fbError) {
      console.warn(`[resilience] Fallback ${candidate.id} threw: ${(fbError as Error).message}`);
    }
  }

  return null;
}

type TryResult =
  | { ok: true; text: string }
  | { ok: false; error: unknown };

async function tryProvider(provider: AIProvider, params: ChatParams): Promise<TryResult> {
  try {
    const text = await provider.chat(params);
    if (!text || text.trim().length === 0) {
      return { ok: false, error: new Error(`Empty response from ${provider.id}/${provider.model}`) };
    }
    return { ok: true, text };
  } catch (error) {
    return { ok: false, error };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
