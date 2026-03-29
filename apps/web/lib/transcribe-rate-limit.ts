import { checkSlidingWindowRateLimit } from "./sliding-window-rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
/** Per-IP cap (Whisper cost protection; in-memory per instance). */
const MAX_REQUESTS = 30;

export function checkTranscribeRateLimit(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
  return checkSlidingWindowRateLimit(key, MAX_REQUESTS, WINDOW_MS);
}
