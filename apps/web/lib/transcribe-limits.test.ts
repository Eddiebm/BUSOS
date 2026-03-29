import { describe, expect, it } from "vitest";
import { transcribePayloadTooLarge, TRANSCRIBE_MAX_BYTES } from "./transcribe-limits";

describe("transcribe-limits", () => {
  it("rejects payloads over max", () => {
    expect(transcribePayloadTooLarge(TRANSCRIBE_MAX_BYTES + 1)).toBe(true);
    expect(transcribePayloadTooLarge(TRANSCRIBE_MAX_BYTES)).toBe(false);
  });
});
