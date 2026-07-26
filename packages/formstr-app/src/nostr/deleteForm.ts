import { finalizeEvent, getPublicKey } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils.js";
import { customPublish, getDefaultRelays } from "./common";

const FORM_KIND = 30168;

/**
 * Publishes a NIP-09 deletion request (kind 5) for a form, which is an
 * addressable event of kind 30168. The deletion MUST be signed by the event's
 * author — for a form that's the form's own signing key (the ephemeral key the
 * form was created with), NOT the user's account key. Every place that shows a
 * delete affordance holds that signing key (local forms store it as
 * `privateKey`; "My forms" caches it in `secrets.secretKey`).
 *
 * NIP-09 deletion is a request: compliant relays SHOULD drop the referenced
 * event (and, via the `a` tag, earlier versions of the addressable event), but
 * honoring it is at each relay's discretion. We publish to the form's own
 * relays plus the defaults to maximize reach.
 */
export const requestFormDeletion = async (
  formPubkey: string,
  formId: string,
  signingKey: string,
  relays: string[] = [],
): Promise<void> => {
  const sk = hexToBytes(signingKey);
  if (getPublicKey(sk) !== formPubkey) {
    throw new Error(
      "Cannot delete this form: the available key does not match the form's author.",
    );
  }

  const deletionEvent = finalizeEvent(
    {
      kind: 5,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["a", `${FORM_KIND}:${formPubkey}:${formId}`],
        ["k", String(FORM_KIND)],
      ],
      content: "Form deleted by author",
    },
    sk,
  );

  const targetRelays = Array.from(new Set([...relays, ...getDefaultRelays()]));
  await Promise.allSettled(customPublish(targetRelays, deletionEvent));
};
