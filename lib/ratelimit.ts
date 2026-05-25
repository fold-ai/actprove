import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Sliding-window rate limiter. Uses Upstash when configured, otherwise an
 * in-process counter (per-instance — fine for dev / single region).
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateResult {
  success: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds = 3600,
): Promise<RateResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_TOKEN;

  if (url && token) {
    const redis = new Redis({ url, token });
    const windowKey = `rate:${key}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
    const count = (await redis.incr(windowKey)) as number;
    if (count === 1) await redis.expire(windowKey, windowSeconds);
    const resetAt = (Math.floor(Date.now() / (windowSeconds * 1000)) + 1) * windowSeconds * 1000;
    return { success: count <= limit, remaining: Math.max(0, limit - count), limit, resetAt };
  }

  // In-memory fallback
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    const resetAt = now + windowSeconds * 1000;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, limit, resetAt };
  }
  b.count += 1;
  return {
    success: b.count <= limit,
    remaining: Math.max(0, limit - b.count),
    limit,
    resetAt: b.resetAt,
  };
}
