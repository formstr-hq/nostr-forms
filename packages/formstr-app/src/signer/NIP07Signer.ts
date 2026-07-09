import { Event, EventTemplate, UnsignedEvent } from "nostr-tools";
import { NostrSigner } from "./types"; // Adjust the path as needed

export const nip07Signer: NostrSigner = {
  getPublicKey: async (): Promise<string> => {
    if (!window.nostr) throw new Error("NIP-07 signer not found");
    return window.nostr.getPublicKey();
  },

  signEvent: async (event: EventTemplate): Promise<Event> => {
    if (!window.nostr) throw new Error("NIP-07 signer not found");
    return window.nostr.signEvent(event);
  },

  encrypt: async (pubkey: string, plaintext: string): Promise<string> => {
    // NIP-07 spec: encrypt is the NIP-04 alias
    if (window.nostr?.encrypt) {
      return window.nostr.encrypt(pubkey, plaintext);
    }
    // Fallback to nip04 if available (non-standard but used by some)
    if (window.nostr?.nip04) {
      return window.nostr.nip04.encrypt(pubkey, plaintext);
    }
    throw new Error("NIP-04 encryption not supported");
  },

  decrypt: async (pubkey: string, ciphertext: string): Promise<string> => {
    // NIP-07 spec: decrypt is the NIP-04 alias
    if (window.nostr?.decrypt) {
      return window.nostr.decrypt(pubkey, ciphertext);
    }
    // Fallback to nip04 if available (non-standard but used by some)
    if (window.nostr?.nip04) {
      return window.nostr.nip04.decrypt(pubkey, ciphertext);
    }
    throw new Error("NIP-04 decryption not supported");
  },
  nip44Decrypt: async (pubkey: string, ciphertext: string): Promise<string> => {
    if (window.nostr?.nip44?.decrypt) {
      return window.nostr.nip44.decrypt(pubkey, ciphertext);
    }
    throw new Error("NIP-44 decryption not supported");
  },
  nip44Encrypt: async (pubkey: string, plaintext: string): Promise<string> => {
    if (window.nostr?.nip44?.encrypt) {
      return window.nostr.nip44.encrypt(pubkey, plaintext);
    }
    throw new Error("NIP-44 encryption not supported");
  },
};
