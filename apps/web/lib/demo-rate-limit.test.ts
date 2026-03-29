import { describe, expect, it } from "vitest";
import { checkDemoRateLimit } from "./demo-rate-limit";

describe("checkDemoRateLimit", () => {
  it("allows requests under the cap", () => {
    expect(checkDemoRateLimit("ip-a").ok).toBe(true);
    expect(checkDemoRateLimit("ip-a").ok).toBe(true);
  });

  it("blocks after max requests for the same key", () => {
    const key = `ip-block-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      expect(checkDemoRateLimit(key).ok).toBe(true);
    }
    const last = checkDemoRateLimit(key);
    expect(last.ok).toBe(false);
    if (!last.ok) expect(last.retryAfterSec).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const a = `ip-x-${Date.now()}`;
    const b = `ip-y-${Date.now()}`;
    expect(checkDemoRateLimit(a).ok).toBe(true);
    expect(checkDemoRateLimit(b).ok).toBe(true);
  });
});
