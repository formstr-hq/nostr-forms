import { nip44, generateSecretKey, getPublicKey } from "nostr-tools";
import { hexToBytes, bytesToHex } from "nostr-tools/utils";
import { signerManager } from "../signer";

/**
 * NIP-44 v2 encryption for large payloads
 * Based on NIP-44 spec, but without the nostr-tools size limitation
 */
async function nip44EncryptLarge(plaintext: string, conversationKey: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Generate random nonce (32 bytes)
  const nonce = crypto.getRandomValues(new Uint8Array(32));

  // Derive encryption key from conversation key and nonce using HKDF
  const salt = nonce;
  const info = encoder.encode("nip44-v2");

  // Import conversation key for HKDF
  const baseKey = await crypto.subtle.importKey(
    "raw",
    conversationKey,
    "HKDF",
    false,
    ["deriveBits"]
  );

  // Derive 44 bytes: 32 for chacha key, 12 for chacha nonce
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: info,
    },
    baseKey,
    44 * 8
  );

  const derived = new Uint8Array(derivedBits);
  const chachaKey = derived.slice(0, 32);
  const chachaNonce = derived.slice(32, 44);

  // Use AES-GCM as a substitute for ChaCha20 (WebCrypto doesn't support ChaCha20)
  // This is a pragmatic workaround - ideally we'd use ChaCha20-Poly1305
  const aesKey = await crypto.subtle.importKey(
    "raw",
    chachaKey,
    "AES-GCM",
    false,
    ["encrypt"]
  );

  // Encrypt with AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: chachaNonce,
    },
    aesKey,
    plaintextBytes
  );

  const ciphertextBytes = new Uint8Array(ciphertext);

  // Format: version (1 byte) + nonce (32 bytes) + ciphertext
  const version = new Uint8Array([2]); // v2
  const payload = new Uint8Array(1 + 32 + ciphertextBytes.length);
  payload.set(version, 0);
  payload.set(nonce, 1);
  payload.set(ciphertextBytes, 33);

  // Return as base64
  return uint8ArrayToBase64(payload);
}

/**
 * NIP-44 v2 decryption for large payloads
 */
async function nip44DecryptLarge(ciphertext: string, conversationKey: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  try {
    console.log("nip44DecryptLarge: Starting decryption, ciphertext length:", ciphertext.length);

    // Decode from base64
    const payload = base64ToUint8Array(ciphertext);
    console.log("nip44DecryptLarge: Decoded payload length:", payload.length);

    // Parse: version (1 byte) + nonce (32 bytes) + ciphertext
    const version = payload[0];
    console.log("nip44DecryptLarge: Version:", version);
    if (version !== 2) {
      throw new Error(`Unsupported NIP-44 version: ${version}`);
    }

    const nonce = payload.slice(1, 33);
    const ciphertextBytes = payload.slice(33);
    console.log("nip44DecryptLarge: Ciphertext bytes length:", ciphertextBytes.length);

    // Derive encryption key from conversation key and nonce using HKDF
    const salt = nonce;
    const info = encoder.encode("nip44-v2");

    const baseKey = await crypto.subtle.importKey(
      "raw",
      conversationKey,
      "HKDF",
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: salt,
        info: info,
      },
      baseKey,
      44 * 8
    );

    const derived = new Uint8Array(derivedBits);
    const chachaKey = derived.slice(0, 32);
    const chachaNonce = derived.slice(32, 44);

    // Decrypt with AES-GCM
    const aesKey = await crypto.subtle.importKey(
      "raw",
      chachaKey,
      "AES-GCM",
      false,
      ["decrypt"]
    );

    console.log("nip44DecryptLarge: About to decrypt with AES-GCM");
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: chachaNonce,
      },
      aesKey,
      ciphertextBytes
    );

    console.log("nip44DecryptLarge: Decryption successful");
    return decoder.decode(plaintext);
  } catch (error) {
    console.error("nip44DecryptLarge error:", error);
    throw error;
  }
}

/**
 * Convert Uint8Array to Base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000; // 32KB chunks
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
export function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt a file to the form author's public key
 * Uses responderSecretKey if provided (for anonymous), otherwise uses signer
 * Returns: { ciphertext, uploaderPubkey }
 */
export async function encryptFileToAuthor(
  fileBytes: Uint8Array,
  formAuthorPubkey: string,
  responderSecretKey: Uint8Array | null = null
): Promise<{ ciphertext: string; uploaderPubkey: string }> {
  let uploaderPubkey: string;
  const plaintextBase64 = uint8ArrayToBase64(fileBytes);

  console.log("encryptFileToAuthor called with:", {
    formAuthorPubkey,
    hasResponderSecretKey: !!responderSecretKey,
  });

  // If responderSecretKey provided (anonymous submission)
  if (responderSecretKey) {
    uploaderPubkey = getPublicKey(responderSecretKey);
    console.log("Using responderSecretKey, uploaderPubkey:", uploaderPubkey);

    const conversationKey = nip44.v2.utils.getConversationKey(
      responderSecretKey,
      formAuthorPubkey
    );
    console.log("Encryption conversationKey:", conversationKey);

    // Use our custom implementation that handles large payloads
    const ciphertext = await nip44EncryptLarge(plaintextBase64, conversationKey);
    return { ciphertext, uploaderPubkey };
  }

  // Non-anonymous: use signer (signers handle large payloads fine)
  const signer = await signerManager.getSigner();
  uploaderPubkey = await signer.getPublicKey();

  if (!signer.nip44Encrypt) {
    throw new Error("Signer does not support NIP-44 encryption");
  }

  const ciphertext = await signer.nip44Encrypt(formAuthorPubkey, plaintextBase64);
  return { ciphertext, uploaderPubkey };
}

/**
 * Decrypt file using form's edit key and uploader's public key
 * (Used by form author to decrypt files uploaded by responders)
 */
export async function decryptFileFromUploader(
  ciphertext: string,
  formEditKey: string,
  uploaderPubkey: string
): Promise<Uint8Array> {
  console.log("decryptFileFromUploader called with:", {
    formEditKey: formEditKey.substring(0, 10) + "...",
    formEditKeyFull: formEditKey,
    uploaderPubkey: uploaderPubkey.substring(0, 10) + "...",
    uploaderPubkeyFull: uploaderPubkey,
    ciphertextLength: ciphertext.length,
  });

  try {
    // Create conversation key between form's edit key and uploader's pubkey
    const formEditKeyBytes = hexToBytes(formEditKey);
    console.log("formEditKeyBytes:", formEditKeyBytes);

    const conversationKey = nip44.v2.utils.getConversationKey(
      formEditKeyBytes,
      uploaderPubkey
    );

    console.log("Conversation key created:", conversationKey);

    // Decrypt using our custom implementation that handles large payloads
    const plaintextBase64 = await nip44DecryptLarge(ciphertext, conversationKey);

    if (!plaintextBase64) {
      throw new Error("Decryption failed");
    }

    console.log("Decryption successful, plaintextBase64 length:", plaintextBase64.length);
    return base64ToUint8Array(plaintextBase64);
  } catch (error) {
    console.error("decryptFileFromUploader error:", error);
    throw error;
  }
}

/**
 * Decrypt file as the uploader using secret key
 * (Used by the person who uploaded the file to download their own file)
 */
export async function decryptFileAsUploader(
  ciphertext: string,
  uploaderSecretKey: Uint8Array,
  formAuthorPubkey: string
): Promise<Uint8Array> {
  // Create conversation key between uploader's secret key and form author's pubkey
  const conversationKey = nip44.v2.utils.getConversationKey(
    uploaderSecretKey,
    formAuthorPubkey
  );

  // Decrypt using our custom implementation that handles large payloads
  const plaintextBase64 = await nip44DecryptLarge(ciphertext, conversationKey);

  if (!plaintextBase64) {
    throw new Error("Decryption failed");
  }

  return base64ToUint8Array(plaintextBase64);
}

/**
 * Decrypt file as the uploader using their signer
 * (Used when the uploader used their Nostr signer to upload)
 */
export async function decryptFileWithSigner(
  ciphertext: string,
  formAuthorPubkey: string
): Promise<Uint8Array> {
  const signer = await signerManager.getSigner();

  if (!signer.nip44Decrypt) {
    throw new Error("Signer does not support NIP-44 decryption");
  }

  // Signer handles decryption
  const plaintextBase64 = await signer.nip44Decrypt(formAuthorPubkey, ciphertext);

  if (!plaintextBase64) {
    throw new Error("Decryption failed");
  }

  return base64ToUint8Array(plaintextBase64);
}
