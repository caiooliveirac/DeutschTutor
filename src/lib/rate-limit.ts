/**
 * Simple in-memory rate limiter (token bucket).
 * For single-instance deployments. For multi-instance, use Redis/Upstash.
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  /** Max tokens (requests) in the bucket */
  maxTokens: number;
  /** Refill interval in milliseconds */
  refillIntervalMs: number;
  /** Tokens to add per refill interval */
  refillAmount: number;
}

/**
 * Check rate limit for a given key (e.g., IP or "global").
 * Returns { allowed, remaining, retryAfterMs }.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  let entry = buckets.get(key);

  if (!entry) {
    entry = { tokens: config.maxTokens, lastRefill: now };
    buckets.set(key, entry);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const refills = Math.floor(elapsed / config.refillIntervalMs);
  if (refills > 0) {
    entry.tokens = Math.min(config.maxTokens, entry.tokens + refills * config.refillAmount);
    entry.lastRefill = now;
  }

  if (entry.tokens > 0) {
    entry.tokens--;
    return { allowed: true, remaining: entry.tokens, retryAfterMs: 0 };
  }

  const retryAfterMs = config.refillIntervalMs - (now - entry.lastRefill);
  return { allowed: false, remaining: 0, retryAfterMs: Math.max(retryAfterMs, 1000) };
}

// Preset configs
export const AI_RATE_LIMIT: RateLimitConfig = {
  maxTokens: 20,         // 20 requests
  refillIntervalMs: 60_000, // per minute
  refillAmount: 5,        // refill 5 per minute
};

export const GENERAL_RATE_LIMIT: RateLimitConfig = {
  maxTokens: 60,
  refillIntervalMs: 60_000,
  refillAmount: 20,
};
