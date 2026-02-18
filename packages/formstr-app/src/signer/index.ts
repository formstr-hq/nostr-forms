import { nip07Signer } from "./NIP07Signer";
import { createNip46Signer } from "./NIP46Signer";
import { NostrSigner } from "./types";
import {
  getBunkerUriInLocalStorage,
  getKeysFromLocalStorage,
  setBunkerUriInLocalStorage,
  setKeysInLocalStorage,
  removeKeysFromLocalStorage,
  removeBunkerUriFromLocalStorage,
  removeAppSecretFromLocalStorage,
} from "./utils";
import { createLocalSigner } from "./LocalSigner";

class Signer {
  private signer: NostrSigner | null = null;
  private onChangeCallbacks: Set<() => void> = new Set();
  private loginModalCallback: (() => Promise<void>) | null = null;

  constructor() {
    this.restoreFromStorage();
  }

  registerLoginModal(callback: () => Promise<void>) {
    this.loginModalCallback = callback;
  }

  async restoreFromStorage() {
    const keys = getKeysFromLocalStorage();
    const bunkerUri = getBunkerUriInLocalStorage();
    try {
      if (bunkerUri?.bunkerUri) {
        await this.loginWithNip46(bunkerUri.bunkerUri);
        return;
      } else if (window.nostr && Object.keys(keys).length != 0) {
        console.log("Restoring loginWithNip07");
        await this.loginWithNip07(keys.pubkey);
        return;
      } else if (keys?.pubkey && keys?.secret) {
        console.log("Restoring guest");
        await this.loginWithGuestKey(keys.pubkey, keys.secret);
      }
    } catch (e) {
      console.error("Signer restore failed:", e);
    }
    this.notify();
  }
  private async loginWithGuestKey(pubkey: string, privkey: string) {
    this.signer = createLocalSigner(privkey);
  }

  async createGuestAccount(
    privkey: string,
    userMetadata: { name?: string; picture?: string; about?: string },
  ) {
    this.signer = createLocalSigner(privkey);

    const pubkey = await this.signer.getPublicKey();

    // Save keys and user data
    setKeysInLocalStorage(pubkey, privkey);
    this.notify();
  }

  async loginWithNip07(pubkey?: string) {
    if (!window.nostr) throw new Error("NIP-07 extension not found");
    this.signer = nip07Signer;
    setKeysInLocalStorage(pubkey ? pubkey : await this.signer.getPublicKey());
    this.notify();
    console.log("LOGGIN IN WITH NIP07 IS NOW COMPLETE");
  }

  async loginWithNip46(bunkerUri: string) {
    const remoteSigner = await createNip46Signer(bunkerUri);
    const pubkey = await remoteSigner.getPublicKey();
    setKeysInLocalStorage(pubkey);
    setBunkerUriInLocalStorage(bunkerUri);
    this.signer = remoteSigner;
    this.notify();
    console.log("LOGIN WITH BUNKER COMPLETE");
  }

  logout() {
    this.signer = null;
    removeKeysFromLocalStorage();
    removeBunkerUriFromLocalStorage();
    removeAppSecretFromLocalStorage();
    console.log("Logged out from everywhere");
    this.notify();
  }

  getSignerIfAvailable(): NostrSigner | null {
    return this.signer;
  }

  async getSigner(): Promise<NostrSigner> {
    if (this.signer) return this.signer;

    if (this.loginModalCallback) {
      console.log("GOING TO CALL LOGINMODALCALLBACK");
      await this.loginModalCallback();
      console.log("AFTER CALLING loginModal Callback", this.signer);
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
