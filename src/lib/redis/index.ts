import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 5) return null;          // stop retrying after 5 attempts
        return Math.min(times * 200, 2000);  // exponential backoff
      },
    });

    redis.on("error", (err) => {
      console.error("[redis] connection error:", err.message);
    });
  }
  return redis;
}

/**
 * Rate-limit check using Redis sliding window.
 * Returns { allowed, remaining, retryAfterMs }.
 */
export async function redisRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  const r = getRedis();
  const now = Date.now();
  const windowStart = now - windowMs;
  const fullKey = `rl:${key}`;

  try {
    // Sorted set: score = timestamp, member = unique request id
    const pipeline = r.pipeline();
    pipeline.zremrangebyscore(fullKey, 0, windowStart);  // prune old entries
    pipeline.zadd(fullKey, now, `${now}:${Math.random().toString(36).slice(2, 8)}`);
    pipeline.zcard(fullKey);
    pipeline.pexpire(fullKey, windowMs);
    const results = await pipeline.exec();

    const count = (results?.[2]?.[1] as number) ?? 0;

    if (count <= maxRequests) {
      return { allowed: true, remaining: maxRequests - count, retryAfterMs: 0 };
    }

    // Over limit — prune the entry we just added
    await r.zremrangebyscore(fullKey, now, now);
    return { allowed: false, remaining: 0, retryAfterMs: windowMs };
  } catch {
    // If Redis is down, allow the request (fail-open)
    console.warn("[redis] rate-limit check failed, allowing request");
    return { allowed: true, remaining: maxRequests, retryAfterMs: 0 };
  }
}
