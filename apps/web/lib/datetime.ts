import { formatInTimeZone } from "date-fns-tz";
import { formatDistanceToNow } from "date-fns";

const DEFAULT_TZ = "UTC";

export function formatUserDateTime(iso: string | Date, timeZone?: string | null): string {
  const tz = timeZone?.trim() || DEFAULT_TZ;
  try {
    return formatInTimeZone(typeof iso === "string" ? new Date(iso) : iso, tz, "MMM d, yyyy · h:mm a zzz");
  } catch {
    return new Date(iso).toISOString();
  }
}

/** Relative time from now (UTC-safe; wall-clock nuance is in `formatUserDateTime`). */
export function formatRelative(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return formatDistanceToNow(d, { addSuffix: true });
}
