import React, {
  createContext,
  useState,
  useContext,
  FC,
  ReactNode,
  useEffect,
} from "react";
import { LOCAL_STORAGE_KEYS, getItem, setItem } from "../utils/localStorage";
import { Filter } from "nostr-tools";
import type { StoredAccount } from "@formstr/signer";
import { fetchOne, setUserRelays as setWorkerRelays } from "../dataLayer";
import { isLoginCancelledError, LoginCancelledError, signerManager } from "../signer";
import LoginModal from "../components/LoginModal";

interface ProfileProviderProps {
  children?: ReactNode;
}

export interface ProfileContextType {
  pubkey?: string;
  accounts: StoredAccount[];
  requestPubkey: () => Promise<string | undefined>;
  addAccount: () => Promise<string | undefined>;
  switchAccount: (pubkey: string) => Promise<{ locked: boolean }>;
  unlockActiveWithPassphrase: (passphrase: string) => Promise<void>;
  removeAccount: (pubkey: string) => Promise<void>;
  logout: () => void;
  userRelays: string[];
}

export interface IProfile {
  pubkey: string;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(
  undefined,
);

export const ProfileProvider: FC<ProfileProviderProps> = ({ children }) => {
  const [pubkey, setPubkey] = useState<string | undefined>(undefined);
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [userRelays, setUserRelays] = useState<string[]>([]);
  const [showLooginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginHandler, setLoginHandler] = useState<{
    onSuccess: () => void;
    onCancel: () => void;
  } | null>(null);
  const fetchUserRelays = async (pubkey: string) => {
    let filter: Filter = {
      kinds: [10002],
      authors: [pubkey],
    };
    let relayEvent = await fetchOne([filter]);
    if (!relayEvent) return;
    let relayUrls = relayEvent.tags
      .filter((t) => t[0] === "r")
      .map((r) => r[1]);
    setUserRelays(relayUrls);
    // Point the worker's read routing at the user's own relays.
    setWorkerRelays(relayUrls);
  };

  // Shared by both the implicit "you need to be signed in" prompt
  // (registered below, driven by signerManager.getSigner()) and the explicit
  // addAccount() flow — either way, the modal resolves/rejects the same way.
  const openLoginModal = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      setShowLoginModal(true);

      // Pass a function to LoginModal to call on successful login
      const handleLoginSuccess = () => {
        setShowLoginModal(false);
        resolve(); // This finally unblocks getSigner
      };

      // Pass a function to handle modal close without login
      const handleLoginCancel = () => {
        setShowLoginModal(false);
        reject(new LoginCancelledError()); // Unblock getSigner with a cancellable error
      };

      setLoginHandler(() => ({
        onSuccess: handleLoginSuccess,
        onCancel: handleLoginCancel,
      }));
    });
  };

  useEffect(() => {
    signerManager.registerLoginModal(openLoginModal);
    const syncFromSigner = async () => {
      setAccounts(signerManager.listAccounts());
      const signer = signerManager.getSignerIfAvailable();
      if (signer) {
        try {
          const pk = await signer.getPublicKey();
          setPubkey(pk);
          return;
        } catch {
          // fall through to the active-account identity below
        }
      }
      // No usable signer yet — e.g. a locked ncryptsec account after reload, or
      // an unlock still in flight. Keep the user signed in under their active
      // account's identity rather than dropping them to a logged-out state;
      // signing will prompt for unlock on demand. Only a genuine absence of any
      // account (real logout) clears the pubkey.
      const activeAccount = signerManager.getActiveAccount();
      setPubkey(activeAccount?.pubkey);
    };
    const unsubscribe = signerManager.onChange(syncFromSigner);
    // The signer may have already restored a session (e.g. a silently
    // unlocked NIP-07/bunker account, or a legacy guest key) before this
    // listener was registered — its notify() would have fired into an empty
    // subscriber set. Check current state directly so that case isn't missed.
    syncFromSigner();
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const profile = getItem<IProfile>(LOCAL_STORAGE_KEYS.PROFILE);
    if (profile) {
      setPubkey(profile.pubkey);
      fetchUserRelays(profile.pubkey);
    } else {
      console.log("Couldn't find npub");
    }
  }, []);

  const logout = () => {
    setItem(LOCAL_STORAGE_KEYS.PROFILE, null);
    setPubkey(undefined);
    signerManager.logout();
  };

  const requestPubkey = async () => {
    try {
      const publicKey = await (await signerManager.getSigner()).getPublicKey();
      setPubkey(publicKey);
      setItem(LOCAL_STORAGE_KEYS.PROFILE, { pubkey: publicKey });
      return publicKey;
    } catch (error) {
      if (isLoginCancelledError(error)) {
        return undefined;
      }

      throw error;
    }
  };

  /**
   * Opens the login modal regardless of whether a signer is already
   * active, so a signed-in user can add another account. Every
   * loginWith-style method (and createAccount) persists+activates a new
   * account without touching any previously-stored ones.
   */
  const addAccount = async (): Promise<string | undefined> => {
    try {
      await openLoginModal();
      const signer = signerManager.getSignerIfAvailable();
      if (!signer) return undefined;
      const publicKey = await signer.getPublicKey();
      setPubkey(publicKey);
      setItem(LOCAL_STORAGE_KEYS.PROFILE, { pubkey: publicKey });
      return publicKey;
    } catch (error) {
      if (isLoginCancelledError(error)) {
        return undefined;
      }
      throw error;
    }
  };

  const switchAccount = async (targetPubkey: string) => {
    const result = await signerManager.switchAccount(targetPubkey);
    setItem(LOCAL_STORAGE_KEYS.PROFILE, { pubkey: targetPubkey });
    return result;
  };

  const unlockActiveWithPassphrase = async (passphrase: string) => {
    await signerManager.unlockActiveWithPassphrase(passphrase);
  };

  const removeAccount = async (targetPubkey: string) => {
    await signerManager.removeAccount(targetPubkey);
    const activeAccount = signerManager.getActiveAccount();
    setItem(
      LOCAL_STORAGE_KEYS.PROFILE,
      activeAccount ? { pubkey: activeAccount.pubkey } : null,
    );
  };

  return (
    <ProfileContext.Provider
      value={{
        pubkey,
        accounts,
        requestPubkey,
        addAccount,
        switchAccount,
        unlockActiveWithPassphrase,
        removeAccount,
        logout,
        userRelays,
      }}
    >
      {children}
      <LoginModal
        open={showLooginModal}
        onClose={() => {
          loginHandler?.onCancel(); // reject the promise so getSigner doesn't hang
          setLoginHandler(null);
        }}
        onLogin={() => {
          loginHandler?.onSuccess(); // this resolves the promise in getSigner
          setLoginHandler(null);
        }}
      />
    </ProfileContext.Provider>
  );
};
