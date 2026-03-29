/**
 * In-memory per-IP rate limit for API routes.
 * For production at scale, replace with @upstash/ratelimit + Redis.
 */

const windowMs = 60 * 1000; // 1 minute
const maxPerWindow = 100; // requests per IP per minute

const store = new Map<string, { count: number; resetAt: number }>();

function cleanup() {
  const now = Date.now();
  for (const [key, v] of store.entries()) {
    if (v.resetAt < now) store.delete(key);
  }
}

export function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  if (store.size > 10000) cleanup();

  let entry = store.get(identifier);
  if (!entry) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(identifier, entry);
    return false;
  }
  entry.count++;
  return entry.count > maxPerWindow;
}

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip || "unknown";
}
