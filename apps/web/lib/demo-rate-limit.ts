import { checkSlidingWindowRateLimit } from "./sliding-window-rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 10;

export function checkDemoRateLimit(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
  return checkSlidingWindowRateLimit(key, MAX_REQUESTS, WINDOW_MS);
}

export { clientIpFromRequest } from "./request-ip";
