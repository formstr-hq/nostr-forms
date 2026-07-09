// singletons/Signer/LocalSigner.ts
import { getPublicKey, finalizeEvent, nip04, nip44 } from "nostr-tools";
import { NostrSigner } from "./types";
import { hexToBytes } from "@noble/hashes/utils";
export function createLocalSigner(privkey: string): NostrSigner {
  const pubkey = getPublicKey(hexToBytes(privkey));

  return {
    getPublicKey: async () => pubkey,

    signEvent: async (event) => {
      const signedEvent = finalizeEvent(event, hexToBytes(privkey));
      return signedEvent;
    },

    encrypt: async (peerPubkey: string, plaintext: string) => {
      // Use NIP-04 for backwards compatibility with older clients
      return nip04.encrypt(privkey, peerPubkey, plaintext);
    },

    decrypt: async (peerPubkey: string, ciphertext: string) => {
      // Use NIP-04 for backwards compatibility with older clients
      return nip04.decrypt(privkey, peerPubkey, ciphertext);
    },

    nip44Encrypt: async (peerPubkey, plaintext) => {
      let conversationKey = nip44.v2.utils.getConversationKey(
        hexToBytes(privkey),
        peerPubkey
      );
      return nip44.v2.encrypt(plaintext, conversationKey);
    },

    nip44Decrypt: async (peerPubkey, ciphertext) => {
      let conversationKey = nip44.v2.utils.getConversationKey(
        hexToBytes(privkey),
        peerPubkey
      );
      return nip44.v2.decrypt(ciphertext, conversationKey);
    },
  };
}
