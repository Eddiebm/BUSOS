import { describe, expect, it } from "vitest";
import { checkSlidingWindowRateLimit } from "./sliding-window-rate-limit";

describe("checkSlidingWindowRateLimit", () => {
  it("allows requests under the cap", () => {
    expect(checkSlidingWindowRateLimit("a", 10, 60_000).ok).toBe(true);
    expect(checkSlidingWindowRateLimit("a", 10, 60_000).ok).toBe(true);
  });

  it("blocks after max requests for the same key", () => {
    const key = `sw-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkSlidingWindowRateLimit(key, 5, 60_000).ok).toBe(true);
    }
    const last = checkSlidingWindowRateLimit(key, 5, 60_000);
    expect(last.ok).toBe(false);
    if (!last.ok) expect(last.retryAfterSec).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const a = `sw-x-${Date.now()}`;
    const b = `sw-y-${Date.now()}`;
    expect(checkSlidingWindowRateLimit(a, 2, 60_000).ok).toBe(true);
    expect(checkSlidingWindowRateLimit(b, 2, 60_000).ok).toBe(true);
  });
});
