/** OpenAI Whisper file limit is 25 MB; stay within it. */
export const TRANSCRIBE_MAX_BYTES = 25 * 1024 * 1024;

export function transcribePayloadTooLarge(byteLength: number): boolean {
  return byteLength > TRANSCRIBE_MAX_BYTES;
}
