import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env, isUpstashConfigured } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger({ component: "rate-limit" });

interface Bucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec?: number;
  backend: "upstash" | "memory";
}

function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, backend: "memory" };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1_000),
      backend: "memory",
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, backend: "memory" };
}

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis && isUpstashConfigured()) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  if (!redis) {
    throw new Error("Upstash Redis not configured");
  }
  return redis;
}

const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1_000));
  const cacheKey = `${limit}:${windowSec}`;

  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: "reviewlens:rl",
      analytics: true,
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!isUpstashConfigured()) {
    if (process.env.NODE_ENV === "production") {
      log.warn("Upstash not configured — using in-memory rate limits", { key });
    }
    return rateLimitMemory(key, limit, windowMs);
  }

  try {
    const limiter = getUpstashLimiter(limit, windowMs);
    const result = await limiter.limit(key);

    return {
      ok: result.success,
      remaining: result.remaining,
      retryAfterSec: result.success
        ? undefined
        : Math.ceil((result.reset - Date.now()) / 1_000),
      backend: "upstash",
    };
  } catch (error) {
    log.error("Upstash rate limit failed — falling back to memory", {
      key,
      error: String(error),
    });
    return rateLimitMemory(key, limit, windowMs);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitResponseHeaders(
  result: RateLimitResult
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Backend": result.backend,
  };
  if (result.retryAfterSec) {
    headers["Retry-After"] = String(result.retryAfterSec);
  }
  return headers;
}
