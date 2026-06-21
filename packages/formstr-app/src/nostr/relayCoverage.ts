import { Event } from "nostr-tools";
import { normalizeURL } from "nostr-tools/utils";
import { pool } from "../pool";

export type RelayCoverageStatus = "checking" | "found" | "not-found" | "error";

export interface RelayCoverageResult {
  url: string;
  status: RelayCoverageStatus;
  createdAt?: number;
}

const FORM_KIND = 30168;

/**
 * Queries each relay individually to determine whether it currently serves the
 * form's replaceable event (kind 30168). Results are reported per relay both via
 * the optional onUpdate callback (for live UI updates) and the resolved array.
 */
export const checkRelayCoverage = async (
  pubKey: string,
  formId: string,
  relays: string[],
  onUpdate?: (result: RelayCoverageResult) => void,
  timeoutMs: number = 4000,
): Promise<RelayCoverageResult[]> => {
  const filter = { kinds: [FORM_KIND], authors: [pubKey], "#d": [formId] };

  return Promise.all(
    relays.map(async (rawUrl): Promise<RelayCoverageResult> => {
      let url = rawUrl;
      try {
        url = normalizeURL(rawUrl);
      } catch {
        const result: RelayCoverageResult = { url, status: "error" };
        onUpdate?.(result);
        return result;
      }
      try {
        const events = (await Promise.race([
          pool.querySync([url], filter, { maxWait: timeoutMs }),
          new Promise<Event[]>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), timeoutMs + 1500),
          ),
        ])) as Event[];
        const latest = events.sort((a, b) => b.created_at - a.created_at)[0];
        const result: RelayCoverageResult = latest
          ? { url, status: "found", createdAt: latest.created_at }
          : { url, status: "not-found" };
        onUpdate?.(result);
        return result;
      } catch {
        const result: RelayCoverageResult = { url, status: "error" };
        onUpdate?.(result);
        return result;
      }
    }),
  );
};
