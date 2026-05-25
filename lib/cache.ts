import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Distributed cache with graceful fallback. Uses Upstash Redis when configured
 * (UPSTASH_REDIS_REST_URL/TOKEN), otherwise an in-process Map with TTL — so the
 * app works in development without Redis (spec §11.2).
 */

type Entry = { value: unknown; expires: number };
const mem = new Map<string, Entry>();

let redis: Redis | null = null;
function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (r) return (await r.get<T>(key)) ?? null;
  const e = mem.get(key);
  if (!e) return null;
  if (e.expires < Date.now()) {
    mem.delete(key);
    return null;
  }
  return e.value as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number) {
  const r = getRedis();
  if (r) {
    await r.setex(key, ttlSeconds, value as never);
    return;
  }
  mem.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

/** Cache-aside helper: return cached value or compute, store, and return it. */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const result = await fn();
  await cacheSet(key, result, ttlSeconds);
  return result;
}

export async function invalidate(key: string) {
  const r = getRedis();
  if (r) {
    await r.del(key);
    return;
  }
  mem.delete(key);
}
