import type { NextRequest } from "next/server";

const buckets = new Map<string, { tokens: number; lastRefill: number }>();

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  retryAfterMs?: number;
};

function refill(bucketKey: string, options: RateLimitOptions) {
  const now = Date.now();
  const bucket = buckets.get(bucketKey);
  if (!bucket) {
    buckets.set(bucketKey, {
      tokens: options.limit - 1,
      lastRefill: now,
    });
    return { success: true, remaining: options.limit - 1 };
  }

  const elapsed = now - bucket.lastRefill;
  if (elapsed >= options.windowMs) {
    bucket.tokens = options.limit;
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    const retryAfterMs = Math.max(options.windowMs - elapsed, 0);
    return { success: false, remaining: 0, retryAfterMs };
  }

  bucket.tokens -= 1;
  return { success: true, remaining: bucket.tokens };
}

function getClientIdentifier(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function enforceRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
  bucketName = "default"
): RateLimitResult {
  const identifier = getClientIdentifier(request);
  const key = `${bucketName}:${identifier}`;
  return refill(key, options);
}
