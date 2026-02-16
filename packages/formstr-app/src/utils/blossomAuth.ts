import { signerManager } from "../signer";
import { finalizeEvent, getPublicKey } from "nostr-tools";

export async function createAuthEvent(
  verb: "upload" | "get" | "delete",
  sha256OrContent: string, // sha256 hash for upload/get/delete, or custom content
  expirationSeconds = 60,
  secretKey?: Uint8Array, // Optional: if provided, use this instead of signer
  humanReadableContent?: string // Optional: human-readable content for the event
) {
  const now = Math.floor(Date.now() / 1000);

  // Determine content and x tag based on verb
  let content: string;
  const tags: string[][] = [
    ["t", verb],
    ["expiration", String(now + expirationSeconds)],
  ];

  if (humanReadableContent) {
    // Use provided human-readable content and add x tag with sha256
    content = humanReadableContent;
    tags.push(["x", sha256OrContent]);
  } else {
    // Legacy behavior: use sha256OrContent as both content and x tag for upload/delete
    // For get, just use it as content (backwards compatible)
    if (verb === "upload" || verb === "delete") {
      content = verb === "upload" ? "Upload blob" : "Delete blob";
      tags.push(["x", sha256OrContent]);
    } else {
      content = sha256OrContent;
    }
  }

  let signedEvent;

  if (secretKey) {
    // Use provided secret key (for anonymous uploads or form owner downloads)
    const pubkey = getPublicKey(secretKey);
    const event = {
      kind: 24242,
      pubkey,
      content,
      created_at: now,
      tags,
    };
    signedEvent = finalizeEvent(event, secretKey);
  } else {
    // Use signer (for authenticated uploads)
    const signer = await signerManager.getSigner();
    if (!signer || !signer.signEvent) {
      throw new Error("No Nostr signer available");
    }

    const pubkey = await signer.getPublicKey();
    const event = {
      kind: 24242,
      pubkey,
      content,
      created_at: now,
      tags,
    };
    signedEvent = await signer.signEvent(event);
  }

  const b64 = btoa(JSON.stringify(signedEvent));
  return `Nostr ${b64}`;
}
