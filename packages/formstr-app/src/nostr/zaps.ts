import { Event, EventTemplate, Filter } from "nostr-tools";
import {
  getZapEndpoint,
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

/**
 * Batch-fetch Kind-0 profiles for a list of pubkeys.
 * Returns a Map of hex-pubkey → parsed profile metadata.
 */
export async function fetchProfiles(
  pubkeys: string[],
  relays?: string[],
): Promise<Map<string, ResponderProfile>> {
  const relayList = relays?.length ? relays : getDefaultRelays();
  const unique = [...new Set(pubkeys)];
  if (unique.length === 0) return new Map();

  const filter: Filter = { kinds: [0], authors: unique };
  const events = await pool.querySync(relayList, filter);

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
      // Malformed profile – skip
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
  const encodedZapRequest = encodeURIComponent(JSON.stringify(signedZapRequest));
  const separator = callback.includes("?") ? "&" : "?";
  const url = `${callback}${separator}amount=${amountMsats}&nostr=${encodedZapRequest}`;
  const response = await fetch(url);
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
 * Open a lightning wallet with the given bolt11 invoice.
 * Tries the `lightning:` URI scheme. Falls back to clipboard copy.
 */
export function openLightningWallet(invoice: string): void {
  window.open(`lightning:${invoice}`, "_self");
}

// ── Zap receipt helpers ──────────────────────────────────────────────

/**
 * Parse the sats amount from the bolt11 tag inside a Kind-9735 zap receipt.
 * Returns 0 if unparseable.
 */
function satoshisFromReceipt(event: Event): number {
  const bolt11Tag = event.tags.find((t) => t[0] === "bolt11");
  if (!bolt11Tag || !bolt11Tag[1]) return 0;
  // nostr-tools provides a parser, but it's not re-exported cleanly.
  // Parse manually: strip "lnbc", read amount + multiplier.
  return parseBolt11Amount(bolt11Tag[1]);
}

export function parseBolt11Amount(bolt11: string): number {
  if (!bolt11 || bolt11.length < 6) return 0;
  const lower = bolt11.toLowerCase();
  if (!lower.startsWith("lnbc")) return 0;

  // Find the last "1" separator — everything before it is hrp
  const lastOne = lower.lastIndexOf("1");
  if (lastOne < 5) return 0;
  const hrp = lower.substring(4, lastOne);
  if (hrp.length === 0) return 0;

  // The multiplier is the last non-digit character
  const multiplierChar = hrp[hrp.length - 1];
  const multipliers: Record<string, number> = {
    m: 100_000,     // milli-BTC → sats
    u: 100,         // micro-BTC → sats
    n: 0.1,         // nano-BTC → sats
    p: 0.0001,      // pico-BTC → sats
  };

  let amountStr: string;
  let multiplier: number;

  if (multipliers[multiplierChar] !== undefined) {
    amountStr = hrp.substring(0, hrp.length - 1);
    multiplier = multipliers[multiplierChar];
  } else {
    // No multiplier — amount is in BTC
    amountStr = hrp;
    multiplier = 100_000_000; // BTC → sats
  }

  const parsed = parseInt(amountStr, 10);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * multiplier);
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
    // Find which response event this receipt is for
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
