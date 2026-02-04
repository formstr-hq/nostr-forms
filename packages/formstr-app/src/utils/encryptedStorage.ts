import { ILocalForm } from "../containers/CreateFormNew/providers/FormBuilder/typeDefs";
import { NostrSigner } from "../signer/types";
import {
  getItem,
  setItem,
  LOCAL_STORAGE_KEYS,
  LocalFormsMeta,
} from "./localStorage";

export interface EncryptedStorageError {
  type: "login_required" | "wrong_key" | "encryption_not_supported" | "unknown";
  message: string;
  encryptedBy?: string;
}

/**
 * Get the current encryption metadata
 */
export function getEncryptionMeta(): LocalFormsMeta | null {
  return getItem<LocalFormsMeta>(LOCAL_STORAGE_KEYS.LOCAL_FORMS_META);
}

/**
 * Check if storage is currently encrypted
 */
export function isStorageEncrypted(): boolean {
  const meta = getEncryptionMeta();
  return meta?.encrypted ?? false;
}

/**
 * Check if storage is encrypted by a specific pubkey
 */
export function isEncryptedByPubkey(pubkey: string): boolean {
  const meta = getEncryptionMeta();
  return meta?.encrypted === true && meta?.encryptedBy === pubkey;
}

/**
 * Get the pubkey that encrypted the storage (if any)
 */
export function getEncryptedByPubkey(): string | undefined {
  const meta = getEncryptionMeta();
  return meta?.encryptedBy;
}

/**
 * Read local forms from storage.
 * If encrypted, requires signer and pubkey to decrypt.
 */
export async function getLocalForms(
  signer?: NostrSigner | null,
  pubkey?: string
): Promise<{ forms: ILocalForm[]; error?: EncryptedStorageError }> {
  const meta = getEncryptionMeta();

  // Not encrypted - return plain data
  if (!meta?.encrypted) {
    const forms = getItem<ILocalForm[]>(LOCAL_STORAGE_KEYS.LOCAL_FORMS) || [];
    return { forms };
  }

  // Encrypted but no signer
  if (!signer || !pubkey) {
    return {
      forms: [],
      error: {
        type: "login_required",
        message: "Login required to access your encrypted forms.",
        encryptedBy: meta.encryptedBy,
      },
    };
  }

  // Check if same pubkey
  if (meta.encryptedBy && meta.encryptedBy !== pubkey) {
    return {
      forms: [],
      error: {
        type: "wrong_key",
        message: "Your forms were encrypted with a different Nostr key.",
        encryptedBy: meta.encryptedBy,
      },
    };
  }

  // Check if signer supports NIP-44
  if (!signer.nip44Decrypt) {
    return {
      forms: [],
      error: {
        type: "encryption_not_supported",
        message: "Your signer doesn't support NIP-44 decryption.",
      },
    };
  }

  // Decrypt
  try {
    const ciphertext = getItem<string>(LOCAL_STORAGE_KEYS.LOCAL_FORMS_ENCRYPTED, {
      parseAsJson: false,
    });
    if (!ciphertext) {
      return { forms: [] };
    }

    const plaintext = await signer.nip44Decrypt(pubkey, ciphertext);
    const forms = JSON.parse(plaintext) as ILocalForm[];
    return { forms };
  } catch (e) {
    console.error("Failed to decrypt forms:", e);
    return {
      forms: [],
      error: {
        type: "unknown",
        message: "Failed to decrypt forms. The data may be corrupted.",
      },
    };
  }
}

/**
 * Save local forms to storage.
 * If encryption is enabled and signer is available, encrypts the data.
 */
export async function setLocalForms(
  forms: ILocalForm[],
  signer?: NostrSigner | null,
  pubkey?: string
): Promise<{ error?: EncryptedStorageError }> {
  const meta = getEncryptionMeta();

  // If encrypted and we have signer, save encrypted
  if (meta?.encrypted && signer && pubkey) {
    // Check if same pubkey
    if (meta.encryptedBy && meta.encryptedBy !== pubkey) {
      return {
        error: {
          type: "wrong_key",
          message: "Cannot save: forms are encrypted with a different key.",
          encryptedBy: meta.encryptedBy,
        },
      };
    }

    // Check if signer supports NIP-44
    if (!signer.nip44Encrypt) {
      return {
        error: {
          type: "encryption_not_supported",
          message: "Your signer doesn't support NIP-44 encryption.",
        },
      };
    }

    try {
      const plaintext = JSON.stringify(forms);
      const ciphertext = await signer.nip44Encrypt(pubkey, plaintext);
      setItem(LOCAL_STORAGE_KEYS.LOCAL_FORMS_ENCRYPTED, ciphertext, {
        parseAsJson: false,
      });
      return {};
    } catch (e) {
      console.error("Failed to encrypt forms:", e);
      return {
        error: {
          type: "unknown",
          message: "Failed to encrypt forms.",
        },
      };
    }
  }

  // Save unencrypted
  setItem(LOCAL_STORAGE_KEYS.LOCAL_FORMS, forms);
  return {};
}

/**
 * Enable encryption for local forms storage.
 * Migrates existing unencrypted data to encrypted format.
 */
export async function enableEncryption(
  signer: NostrSigner,
  pubkey: string
): Promise<{ error?: EncryptedStorageError }> {
  // Check if signer supports NIP-44
  if (!signer.nip44Encrypt) {
    return {
      error: {
        type: "encryption_not_supported",
        message: "Your signer doesn't support NIP-44 encryption.",
      },
    };
  }

  // Read existing unencrypted forms
  const existingForms =
    getItem<ILocalForm[]>(LOCAL_STORAGE_KEYS.LOCAL_FORMS) || [];

  // Encrypt the forms
  try {
    const plaintext = JSON.stringify(existingForms);
    const ciphertext = await signer.nip44Encrypt(pubkey, plaintext);

    // Save encrypted data
    setItem(LOCAL_STORAGE_KEYS.LOCAL_FORMS_ENCRYPTED, ciphertext, {
      parseAsJson: false,
    });

    // Update metadata
    const meta: LocalFormsMeta = {
      encrypted: true,
      encryptedBy: pubkey,
      encryptedAt: new Date().toISOString(),
    };
    setItem(LOCAL_STORAGE_KEYS.LOCAL_FORMS_META, meta);

    // Clear unencrypted data
    localStorage.removeItem(LOCAL_STORAGE_KEYS.LOCAL_FORMS);

    return {};
  } catch (e) {
    console.error("Failed to enable encryption:", e);
    return {
      error: {
        type: "unknown",
        message: "Failed to enable encryption.",
      },
    };
  }
}

/**
 * Disable encryption for local forms storage.
 * Decrypts data and stores it unencrypted.
 */
export async function disableEncryption(
  signer: NostrSigner,
  pubkey: string
): Promise<{ error?: EncryptedStorageError }> {
  const meta = getEncryptionMeta();

  if (!meta?.encrypted) {
    return {}; // Already unencrypted
  }

  // Check if same pubkey
  if (meta.encryptedBy && meta.encryptedBy !== pubkey) {
    return {
      error: {
        type: "wrong_key",
        message: "Cannot disable encryption: encrypted with a different key.",
        encryptedBy: meta.encryptedBy,
      },
    };
  }

  // Check if signer supports NIP-44
  if (!signer.nip44Decrypt) {
    return {
      error: {
        type: "encryption_not_supported",
        message: "Your signer doesn't support NIP-44 decryption.",
      },
    };
  }

  // Decrypt the forms
  try {
    const ciphertext = getItem<string>(LOCAL_STORAGE_KEYS.LOCAL_FORMS_ENCRYPTED, {
      parseAsJson: false,
    });

    let forms: ILocalForm[] = [];
    if (ciphertext) {
      const plaintext = await signer.nip44Decrypt(pubkey, ciphertext);
      forms = JSON.parse(plaintext) as ILocalForm[];
    }

    // Save unencrypted
    setItem(LOCAL_STORAGE_KEYS.LOCAL_FORMS, forms);

    // Update metadata
    const newMeta: LocalFormsMeta = {
      encrypted: false,
    };
    setItem(LOCAL_STORAGE_KEYS.LOCAL_FORMS_META, newMeta);

    // Clear encrypted data
    localStorage.removeItem(LOCAL_STORAGE_KEYS.LOCAL_FORMS_ENCRYPTED);

    return {};
  } catch (e) {
    console.error("Failed to disable encryption:", e);
    return {
      error: {
        type: "unknown",
        message: "Failed to disable encryption.",
      },
    };
  }
}

/**
 * Initialize encryption metadata if it doesn't exist.
 * Call this on app startup.
 */
export function initializeEncryptionMeta(): void {
  const meta = getEncryptionMeta();
  if (!meta) {
    // First time - set as unencrypted
    setItem(LOCAL_STORAGE_KEYS.LOCAL_FORMS_META, {
      encrypted: false,
    } as LocalFormsMeta);
  }
}
