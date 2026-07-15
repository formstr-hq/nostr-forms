import { useState } from "react";
import { signerManager } from "../../signer";

/**
 * React hook for generating a NIP-98 Authorization header.
 */
export function useNostrAuth() {
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate an Authorization header value for a NIP-98 authenticated request.
   * @param url The request URL (can be relative or absolute).
   * @param method HTTP method (GET, POST, etc.).
   * @param body Optional request body (object or string) for hashing.
   * @returns A string like "Nostr <base64-signed-event>".
   */
  async function generateAuthHeader(
    url: string,
    method: string,
    body?: Record<string, any> | string
  ): Promise<string> {
    const signer = await signerManager.getSigner();
    // Ensure a Nostr signer is available (Alby, nos2x, etc.).
    console.log("INSIDE generateAuthHeader");
    if (!signer) {
      const msg =
        "No Nostr signer available (install/enable a browser extension)";
      setError(msg);
      throw new Error(msg);
    }

    try {
      // Construct absolute URL for the `u` tag (include query params if any).
      const absoluteUrl = new URL(url, window.location.href).toString();
      const created_at = Math.floor(Date.now() / 1000);

      // Prepare tags: ["u", "<url>"], ["method", "<METHOD>"].
      const tags: string[][] = [
        ["u", absoluteUrl],
        ["method", method.toUpperCase()],
      ];

      // If there's a body, hash it (SHA-256) and add ["payload", <hex>] tag.
      if (body) {
        const payloadString =
          typeof body === "string" ? body : JSON.stringify(body);
        const encoder = new TextEncoder();
        const data = encoder.encode(payloadString);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        // Convert ArrayBuffer to hex string
        const hashHex = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        tags.push(["payload", hashHex]);
      }

      // Build the Nostr event object.
      const event = {
        kind: 27235,
        created_at,
        tags,
        content: "", // content must be empty per NIP-98:contentReference[oaicite:9]{index=9}.
      };

      // Sign the event with the user's Nostr key. This will add id, pubkey, sig.
      // window.nostr.signEvent is defined by NIP-07 extensions:contentReference[oaicite:10]{index=10}:contentReference[oaicite:11]{index=11}.
      const signedEvent = await signer.signEvent(event);
      // Base64-encode the JSON of the signed event.
      const eventJson = JSON.stringify(signedEvent);
      const token = btoa(eventJson);

      // Return with "Nostr " prefix as required in the Authorization header:contentReference[oaicite:12]{index=12}.
      return `Nostr ${token}`;
    } catch (err: any) {
      // Handle user cancel or other errors.
      const msg = err?.message || "Failed to generate Nostr auth token";
      setError(msg);
      throw new Error(msg);
    }
  }

  return { generateAuthHeader, error };
}
