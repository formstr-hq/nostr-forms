import { signerManager } from "../signer";
import { finalizeEvent, getPublicKey } from "nostr-tools";

export async function createAuthEvent(
  verb: "upload" | "get",
  content: string,
  expirationSeconds = 60,
  secretKey?: Uint8Array // Optional: if provided, use this instead of signer
) {
  const now = Math.floor(Date.now() / 1000);

  let signedEvent;

  if (secretKey) {
    // Use provided secret key (for anonymous uploads or form owner downloads)
    const pubkey = getPublicKey(secretKey);
    const event = {
      kind: 24242,
      pubkey,
      content,
      created_at: now,
      tags: [
        ["t", verb],
        ["expiration", String(now + expirationSeconds)],
      ],
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
      tags: [
        ["t", verb],
        ["expiration", String(now + expirationSeconds)],
      ],
    };
    signedEvent = await signer.signEvent(event);
  }

  const b64 = btoa(JSON.stringify(signedEvent));
  return `Nostr ${b64}`;
}
