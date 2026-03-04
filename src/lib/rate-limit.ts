/**
 * Rate limiter with Redis backend (falls back to in-memory).
 */

import { redisRateLimit } from "./redis";

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
 * Async rate limit — uses Redis sliding window.
 * Falls back to in-memory if Redis unavailable.
 */
export async function checkRateLimitAsync(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  try {
    return await redisRateLimit(key, config.maxTokens, config.refillIntervalMs);
  } catch {
    // Fallback to in-memory
    return checkRateLimit(key, config);
  }
}

/**
 * Sync in-memory rate limit (legacy fallback).
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
  maxTokens: 20,
  refillIntervalMs: 60_000,
  refillAmount: 5,
};

export const GENERAL_RATE_LIMIT: RateLimitConfig = {
  maxTokens: 60,
  refillIntervalMs: 60_000,
  refillAmount: 20,
};
