/** In-memory sliding window per key (best-effort; per server instance in serverless). */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkSlidingWindowRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  if (b.count >= maxRequests) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  b.count += 1;
  return { ok: true };
}
