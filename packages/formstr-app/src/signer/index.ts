import {
  createSigner,
  LocalSigner as PkgLocalSigner,
  type ActiveSigner,
} from "@formstr/signer";
import { SimplePool } from "nostr-tools/pool";
import { hexToBytes } from "@noble/hashes/utils.js";
import { NostrSigner } from "./types";
import { publishKind0 } from "../nostr/common";

export class LoginCancelledError extends Error {
  constructor() {
    super("Login cancelled");
    this.name = "LoginCancelledError";
  }
}

export const isLoginCancelledError = (error: unknown) =>
  error instanceof LoginCancelledError ||
  (error instanceof Error && error.message === "Login cancelled");

// Pre-migration shape: a raw hex secret saved directly under this key by the
// old, home-grown signer. Kept working read-only so existing sessions don't
// get logged out by this swap; nothing writes this shape anymore.
const LEGACY_KEYS_STORAGE = "formstr:keys";

function readLegacyGuestSecret(): string | null {
  try {
    const raw = JSON.parse(localStorage.getItem(LEGACY_KEYS_STORAGE) || "{}");
    return typeof raw?.secret === "string" ? raw.secret : null;
  } catch {
    return null;
  }
}

function toNostrSigner(active: ActiveSigner): NostrSigner {
  return {
    getPublicKey: () => active.getPublicKey(),
    signEvent: (event) => active.signEvent(event),
    encrypt: (pubkey, plaintext) => active.nip04Encrypt(pubkey, plaintext),
    decrypt: (pubkey, ciphertext) => active.nip04Decrypt(pubkey, ciphertext),
    nip44Encrypt: (pubkey, txt) => active.nip44Encrypt(pubkey, txt),
    nip44Decrypt: (pubkey, ct) => active.nip44Decrypt(pubkey, ct),
  };
}

class Signer {
  private pkg = createSigner({
    appName: "Formstr",
    appUrl: window.location.origin,
  });
  private pool = new SimplePool();
  private signer: NostrSigner | null = null;
  private onChangeCallbacks: Set<() => void> = new Set();
  private loginModalCallback: (() => Promise<void>) | null = null;

  constructor() {
    this.restoreFromStorage();
  }

  registerLoginModal(callback: () => Promise<void>) {
    this.loginModalCallback = callback;
  }

  private async restoreFromStorage() {
    try {
      if (this.pkg.getActiveAccount()) {
        const active = await this.pkg.unlock({ pool: this.pool });
        if (active) this.signer = toNostrSigner(active);
      } else {
        const legacySecret = readLegacyGuestSecret();
        if (legacySecret) {
          this.signer = toNostrSigner(new PkgLocalSigner(hexToBytes(legacySecret)));
        }
      }
    } catch (e) {
      console.error("Signer restore failed:", e);
    }
    this.notify();
  }

  private activateCurrent() {
    const active = this.pkg.getActiveSigner();
    this.signer = active ? toNostrSigner(active) : null;
    this.notify();
  }

  async loginWithNcryptsec(ncryptsec: string, password: string): Promise<void> {
    await this.pkg.loginWithNcryptsec(ncryptsec, password);
    this.activateCurrent();
  }

  async signUpWithPassword(
    password: string,
    metadata: { name?: string; username?: string; about?: string; picture?: string },
  ): Promise<string> {
    const { ncryptsec } = await this.pkg.createAccount(password);
    this.activateCurrent();
    if (this.signer) publishKind0(this.signer, metadata).catch(console.error);
    return ncryptsec;
  }

  async loginWithNip07(): Promise<void> {
    if (!window.nostr) throw new Error("NIP-07 extension not found");
    await this.pkg.loginWithExtension();
    this.activateCurrent();
  }

  async loginWithNip46(bunkerUri: string): Promise<void> {
    await this.pkg.loginWithBunkerUri(bunkerUri, { pool: this.pool });
    this.activateCurrent();
  }

  /**
   * NostrConnect (QR) pairing. Relays are caller-supplied — the package has
   * no hardcoded fallback — so the UI can let a user point this at their own
   * relay instead of a fixed default.
   */
  async loginWithNostrConnect(
    relays: string[],
    onUri: (uri: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    await this.pkg.loginWithNostrConnect({ relays, onUri, pool: this.pool, signal });
    this.activateCurrent();
  }

  async logout(): Promise<void> {
    const pubkey = this.pkg.getActiveAccount()?.pubkey;
    if (pubkey) await this.pkg.logout(pubkey);
    localStorage.removeItem(LEGACY_KEYS_STORAGE);
    this.signer = null;
    this.notify();
  }

  /** The saved ncryptsec (if any), so the login UI can offer to reuse it. */
  getSavedNcryptsec(): string | null {
    return this.pkg.listAccounts().find((a) => a.method === "ncryptsec")?.ncryptsec ?? null;
  }

  async forgetSavedNcryptsec(): Promise<void> {
    const account = this.pkg.listAccounts().find((a) => a.method === "ncryptsec");
    if (account) await this.pkg.logout(account.pubkey);
  }

  getSignerIfAvailable(): NostrSigner | null {
    return this.signer;
  }

  async getSigner(): Promise<NostrSigner> {
    if (this.signer) return this.signer;

    if (this.loginModalCallback) {
      await this.loginModalCallback();
      if (this.signer) return this.signer;
    }

    throw new Error("No signer available and no login modal registered.");
  }

  onChange(cb: () => void) {
    this.onChangeCallbacks.add(cb);
    return () => this.onChangeCallbacks.delete(cb);
  }

  private notify() {
    this.onChangeCallbacks.forEach((cb) => cb());
  }
}

export const signerManager = new Signer();
