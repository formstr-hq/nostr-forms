import { nip19 } from "nostr-tools";
import { AddressPointer } from "nostr-tools/nip19";
import { decodeNKeys } from "./nkeys";

export interface ParsedFormUrl {
  naddr: string;
  pubkey: string;
  formId: string;
  relays: string[];
  viewKey?: string;
  secretKey?: string;
}

/**
 * Parses a Nostr Forms URL to extract form identifiers and keys.
 *
 * Supported URL formats:
 * - /f/{naddr} - Form filler
 * - /s/{naddr} - Response/admin view
 * - /edit/{naddr} - Edit form
 *
 * Keys can be provided via:
 * - Hash fragment with nkeys: #nkeys1...
 * - Legacy query param: ?viewKey=...
 * - Legacy hash (secretKey only): #hexstring
 */
export function parseFormUrl(url: string): ParsedFormUrl | null {
  try {
    let urlObj: URL;

    // Handle both full URLs and relative paths
    if (url.startsWith("http://") || url.startsWith("https://")) {
      urlObj = new URL(url);
    } else {
      // For relative paths, use a dummy base
      urlObj = new URL(url, "https://example.com");
    }

    const pathname = urlObj.pathname;
    const hash = urlObj.hash.replace(/^#/, "");
    const searchParams = urlObj.searchParams;

    // Extract naddr from supported path patterns
    const naddrMatch = pathname.match(/^\/(f|s|edit)\/([a-zA-Z0-9]+)/);
    if (!naddrMatch) {
      return null;
    }

    const naddr = naddrMatch[2];

    // Decode naddr to get pubkey, formId, relays
    let decoded: ReturnType<typeof nip19.decode>;
    try {
      decoded = nip19.decode(naddr);
    } catch (e) {
      console.error("Failed to decode naddr:", e);
      return null;
    }

    if (decoded.type !== "naddr") {
      return null;
    }

    const addressPointer = decoded.data as AddressPointer;
    const { pubkey, identifier: formId, relays = [] } = addressPointer;

    // Extract keys from URL
    let viewKey: string | undefined;
    let secretKey: string | undefined;

    // Priority 1: nkeys in hash fragment
    if (hash.startsWith("nkeys")) {
      try {
        const decodedKeys = decodeNKeys(hash);
        viewKey = decodedKeys.viewKey;
        secretKey = decodedKeys.secretKey;
      } catch (e) {
        console.warn("Failed to decode nkeys:", e);
      }
    }

    // Priority 2: viewKey from query params (if not already set)
    if (!viewKey) {
      const paramViewKey = searchParams.get("viewKey");
      if (paramViewKey) {
        viewKey = paramViewKey;
      }
    }

    // Priority 3: Legacy hash format (secretKey as hex string)
    // Only if hash exists and doesn't start with 'nkeys'
    if (!secretKey && hash && !hash.startsWith("nkeys")) {
      // Validate it looks like a hex string (64 chars for a private key)
      if (/^[a-fA-F0-9]{64}$/.test(hash)) {
        secretKey = hash;
      }
    }

    return {
      naddr,
      pubkey,
      formId,
      relays,
      viewKey,
      secretKey,
    };
  } catch (e) {
    console.error("Failed to parse form URL:", e);
    return null;
  }
}

/**
 * Validates if a string could be a valid form URL.
 */
export function isValidFormUrl(url: string): boolean {
  return parseFormUrl(url) !== null;
}
