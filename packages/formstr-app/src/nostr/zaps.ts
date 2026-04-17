import { Event, EventTemplate, Filter } from "nostr-tools";
import {
  getZapEndpoint,
  getSatoshisAmountFromBolt11,
  makeZapRequest,
  validateZapRequest,
} from "nostr-tools/nip57";
import { pool } from "../pool";
import { getDefaultRelays, signEvent } from "./common";

// ── Profile helpers ──────────────────────────────────────────────────

export interface ResponderProfile {
  name?: string;
  picture?: string;
  lud16?: string;
  lud06?: string;
}

// Relays known to index Kind-0 profile events
const PROFILE_RELAYS = [
  "wss://purplepag.es",
  "wss://relay.nostr.band",
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://nos.lol",
];

/**
 * Batch-fetch Kind-0 profiles for a list of pubkeys.
 * Returns a Map of hex-pubkey → parsed profile metadata.
 */
export async function fetchProfiles(
  pubkeys: string[],
  relays?: string[],
): Promise<Map<string, ResponderProfile>> {
  const merged = [...new Set([
    ...(relays || []),
    ...PROFILE_RELAYS,
    ...getDefaultRelays(),
  ])];
  const unique = [...new Set(pubkeys)];
  if (unique.length === 0) return new Map();

  const filter: Filter = { kinds: [0], authors: unique };
  const events = await pool.querySync(merged, filter);

  // Keep newest event per pubkey
  const latest = new Map<string, Event>();
  for (const ev of events) {
    const existing = latest.get(ev.pubkey);
    if (!existing || ev.created_at > existing.created_at) {
      latest.set(ev.pubkey, ev);
    }
  }

  const profiles = new Map<string, ResponderProfile>();
  for (const [pk, ev] of latest) {
    try {
      const parsed = JSON.parse(ev.content);
      profiles.set(pk, {
        name: parsed.name ?? parsed.display_name,
        picture: parsed.picture,
        lud16: parsed.lud16,
        lud06: parsed.lud06,
      });
    } catch {
      // skip unparseable profiles
    }
  }
  return profiles;
}

/**
 * Whether a profile has a lightning address we can zap.
 */
export function hasLightningAddress(profile?: ResponderProfile): boolean {
  if (!profile) return false;
  return !!(profile.lud16 || profile.lud06);
}

// ── Zap request / invoice flow ───────────────────────────────────────

export interface ZapParams {
  /** The Kind-0 event of the person being zapped */
  recipientProfileEvent: Event;
  /** The response event being zapped */
  responseEvent: Event;
  /** The form template event (for the "a" tag reference) */
  formEvent: Event;
  /** Amount in millisats */
  amountMsats: number;
  /** Optional comment attached to the zap */
  comment?: string;
  /** Relays to include in the zap request tags */
  relays?: string[];
}

/**
 * Full zap flow:
 * 1. Resolve the LNURL callback from the recipient's Kind-0 event.
 * 2. Build and sign a Kind-9734 zap request.
 * 3. Call the LNURL callback with amount + zap request to get a bolt11 invoice.
 * 4. Return the invoice string so the caller can open a wallet.
 */
export async function requestZapInvoice(
  params: ZapParams,
): Promise<string> {
  const {
    recipientProfileEvent,
    responseEvent,
    formEvent,
    amountMsats,
    comment,
    relays,
  } = params;
  const relayList = relays?.length ? relays : getDefaultRelays();

  // 1. Resolve LNURL callback
  const callback = await getZapEndpoint(recipientProfileEvent);
  if (!callback) {
    throw new Error("Recipient has no valid LNURL/lud16 endpoint");
  }

  // 2. Build zap request (unsigned event template)
  const zapRequestTemplate: EventTemplate = makeZapRequest({
    event: responseEvent,
    amount: amountMsats,
    relays: relayList,
    comment: comment || "",
  });

  // 3. Sign it with the current user's signer
  const signedZapRequest = await signEvent(zapRequestTemplate, null);

  // Validate our own zap request
  const validationError = validateZapRequest(JSON.stringify(signedZapRequest));
  if (validationError) {
    throw new Error(`Invalid zap request: ${validationError}`);
  }

  // 4. Call the LNURL callback
  const url = new URL(callback);
  url.searchParams.set("amount", amountMsats.toString());
  url.searchParams.set("nostr", JSON.stringify(signedZapRequest));
  if (comment) url.searchParams.set("comment", comment);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`LNURL callback failed: ${response.status}`);
  }
  const body = await response.json();
  if (body.status === "ERROR") {
    throw new Error(body.reason || "LNURL provider returned error");
  }
  if (!body.pr) {
    throw new Error("No invoice returned by LNURL provider");
  }

  return body.pr as string;
}

/**
 * Pay a bolt11 invoice. Tries WebLN (in-browser payment via Alby etc.)
 * first, then falls back to opening a lightning: URI.
 * Returns true if paid in-browser via WebLN.
 */
export async function payInvoice(invoice: string): Promise<boolean> {
  const webln = typeof window !== "undefined" ? (window as any).webln : null;
  if (webln) {
    try {
      await webln.enable();
      await webln.sendPayment(invoice);
      return true;
    } catch {
      // WebLN failed or user rejected — fall through to URI
    }
  }
  window.open(`lightning:${invoice}`, "_self");
  return false;
}

// ── Zap receipt helpers ──────────────────────────────────────────────

/**
 * Extract sats from a Kind-9735 zap receipt.
 * Prefers the `amount` tag (msats), falls back to bolt11 parsing.
 */
function satoshisFromReceipt(event: Event): number {
  // Prefer the `amount` tag (value is in millisats)
  const amountTag = event.tags.find((t) => t[0] === "amount");
  if (amountTag?.[1]) {
    const msats = parseInt(amountTag[1], 10);
    if (!isNaN(msats)) return Math.round(msats / 1000);
  }
  // Fallback: parse the bolt11 invoice
  const bolt11Tag = event.tags.find((t) => t[0] === "bolt11");
  if (bolt11Tag?.[1]) {
    try {
      return getSatoshisAmountFromBolt11(bolt11Tag[1]);
    } catch {
      return 0;
    }
  }
  return 0;
}

export interface ZapTotal {
  totalSats: number;
  count: number;
}

/**
 * Fetch Kind-9735 zap receipts for a set of response event IDs.
 * Returns a Map of responseEventId → { totalSats, count }.
 */
export async function fetchZapReceipts(
  responseEventIds: string[],
  relays?: string[],
): Promise<Map<string, ZapTotal>> {
  const relayList = relays?.length ? relays : getDefaultRelays();
  const unique = [...new Set(responseEventIds)];
  if (unique.length === 0) return new Map();

  const filter: Filter = {
    kinds: [9735],
    "#e": unique,
  };

  const events = await pool.querySync(relayList, filter);

  const totals = new Map<string, ZapTotal>();

  for (const ev of events) {
    const eTag = ev.tags.find((t) => t[0] === "e");
    if (!eTag?.[1]) continue;
    const responseId = eTag[1];
    if (!unique.includes(responseId)) continue;

    const sats = satoshisFromReceipt(ev);
    const existing = totals.get(responseId) || { totalSats: 0, count: 0 };
    existing.totalSats += sats;
    existing.count += 1;
    totals.set(responseId, existing);
  }

  return totals;
}
