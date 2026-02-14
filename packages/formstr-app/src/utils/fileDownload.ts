import { message } from "antd";
import { hexToBytes } from "nostr-tools/utils";
import { FileUploadMetadata } from "../nostr/types";
import { BlossomClient } from "./blossom";
import { createAuthEvent } from "./blossomAuth";
import { decryptFileFromUploader, decryptFileAsUploader, decryptFileWithSigner } from "./blossomCrypto";

export interface DownloadFileParams {
  metadata: FileUploadMetadata;
  // Option 1: Form author downloading (has editKey + uploader's pubkey)
  formEditKey?: string;
  uploaderPubkey?: string;
  // Option 2: Uploader downloading their own file with secret key (anonymous submission)
  uploaderSecretKey?: Uint8Array;
  formAuthorPubkey?: string;
  // Option 3: Uploader downloading their own file with signer (identified submission)
  useSigner?: boolean;
  onProgress?: (step: number) => void; // Optional progress callback
}

/**
 * Downloads and decrypts a file from a Blossom server
 * Supports three scenarios:
 * 1. Form author downloading: provide formEditKey + uploaderPubkey
 * 2. Uploader downloading (anonymous): provide uploaderSecretKey + formAuthorPubkey
 * 3. Uploader downloading (identified): provide useSigner=true + formAuthorPubkey
 * @param params Download parameters including metadata, keys, and optional progress callback
 * @returns Promise that resolves when download is complete
 */
export const downloadEncryptedFile = async ({
  metadata,
  formEditKey,
  uploaderPubkey,
  uploaderSecretKey,
  formAuthorPubkey,
  useSigner,
  onProgress,
}: DownloadFileParams): Promise<void> => {
  try {
    console.log("downloadEncryptedFile called with:", {
      hasFormEditKey: !!formEditKey,
      hasUploaderPubkey: !!uploaderPubkey,
      hasUploaderSecretKey: !!uploaderSecretKey,
      hasFormAuthorPubkey: !!formAuthorPubkey,
      useSigner,
      metadata,
    });

    // Step 0: Create auth event for download
    let authHeader: string;

    if (formEditKey) {
      const authKeyBytes = hexToBytes(formEditKey);
      authHeader = await createAuthEvent("get", metadata.sha256, 60, authKeyBytes);
    } else if (uploaderSecretKey) {
      authHeader = await createAuthEvent("get", metadata.sha256, 60, uploaderSecretKey);
    } else if (useSigner) {
      // createAuthEvent will use the signer when no secretKey is provided
      authHeader = await createAuthEvent("get", metadata.sha256, 60);
    } else {
      throw new Error("Either formEditKey, uploaderSecretKey, or useSigner must be provided");
    }

    onProgress?.(1);

    // Step 1: Download from Blossom server
    const client = new BlossomClient(metadata.server);
    const encryptedBytes = await client.download(metadata.sha256, authHeader);
    onProgress?.(2);

    console.log("Downloaded bytes length:", encryptedBytes.length);
    console.log("Downloaded bytes preview:", encryptedBytes.slice(0, 20));

    // Step 2: Convert bytes to ciphertext string
    const ciphertext = new TextDecoder().decode(encryptedBytes);

    console.log("Ciphertext length:", ciphertext.length);
    console.log("Ciphertext preview:", ciphertext.substring(0, 50));

    // Step 3: Decrypt file based on who is downloading
    let decryptedBytes: Uint8Array;
    if (formEditKey && uploaderPubkey) {
      // Form author downloading
      console.log("Using decryptFileFromUploader (form author path)");
      decryptedBytes = await decryptFileFromUploader(
        ciphertext,
        formEditKey,
        uploaderPubkey
      );
    } else if (uploaderSecretKey && formAuthorPubkey) {
      // Uploader downloading their own file (anonymous)
      console.log("Using decryptFileAsUploader (anonymous uploader path)");
      decryptedBytes = await decryptFileAsUploader(
        ciphertext,
        uploaderSecretKey,
        formAuthorPubkey
      );
    } else if (useSigner && formAuthorPubkey) {
      // Uploader downloading their own file (identified, using signer)
      console.log("Using decryptFileWithSigner (identified uploader path)");
      decryptedBytes = await decryptFileWithSigner(
        ciphertext,
        formAuthorPubkey
      );
    } else {
      console.error("Invalid key combination:", {
        hasFormEditKey: !!formEditKey,
        hasUploaderPubkey: !!uploaderPubkey,
        hasUploaderSecretKey: !!uploaderSecretKey,
        hasFormAuthorPubkey: !!formAuthorPubkey,
        useSigner,
      });
      throw new Error("Invalid key combination for decryption");
    }
    onProgress?.(3);

    // Step 3: Trigger browser download with original filename
    const blob = new Blob([decryptedBytes], { type: metadata.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = metadata.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onProgress?.(4);

    message.success("File downloaded successfully!");
  } catch (error: any) {
    console.error("Download failed:", error);
    if (error.isCorsError) {
      message.error(
        "CORS error: The server may not allow downloads from this origin"
      );
    } else {
      message.error(`Download failed: ${error.message || "Unknown error"}`);
    }
    throw error; // Re-throw so caller can handle if needed
  }
};
