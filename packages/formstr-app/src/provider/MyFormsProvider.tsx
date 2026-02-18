import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { Event } from "nostr-tools";
import { useProfileContext } from "../hooks/useProfileContext";
import { KINDS, Tag } from "../nostr/types";
import { getDefaultRelays } from "../nostr/common";
import { signerManager } from "../signer";
import { pool } from "../pool";

/* ----------------------------- Types ----------------------------- */

type FormEventMetadata = {
  event: Event;
  secrets: { secretKey: string; viewKey?: string };
  relay: string;
};

type MyFormsContextValue = {
  formEvents: Map<string, FormEventMetadata>;
  refreshing: boolean;
  refreshForms: (force?: boolean) => Promise<void>;
  deleteForm: (formId: string, formPubkey: string) => Promise<void>;
  saveToMyForms: (
    formAuthorPub: string,
    formAuthorSecret: string,
    formId: string,
    relays: string[],
    viewKey?: string,
    callback?: (state: "saving" | "saved" | null) => void,
  ) => Promise<void>;
  inMyForms: (formPubkey: string, formId: string) => boolean;
};

/* ---------------------------- Context ---------------------------- */

const MyFormsContext = createContext<MyFormsContextValue | undefined>(
  undefined,
);

/* ------------------------------ Hook ----------------------------- */

export const useMyForms = () => {
  const ctx = useContext(MyFormsContext);
  if (!ctx) {
    throw new Error("useMyForms must be used within MyFormsProvider");
  }
  return ctx;
};

/* ---------------------------- Provider --------------------------- */

export const MyFormsProvider = ({ children }: { children: ReactNode }) => {
  const { pubkey: userPub } = useProfileContext();

  const [formEvents, setFormEvents] = useState<Map<string, FormEventMetadata>>(
    new Map(),
  );
  const [refreshing, setRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);
  const loadedForPubRef = useRef<string | null>(null);

  const fetchFormEvents = async (forms: Tag[]) => {
    const dTags = forms.map((f) => f[1].split(":")[1]);
    const pubkeys = forms.map((f) => f[1].split(":")[0]);

    const filter = {
      kinds: [30168],
      "#d": dTags,
      authors: pubkeys,
    };

    const events = await pool.querySync(getDefaultRelays(), filter);
    const next = new Map<string, FormEventMetadata>();

    forms.forEach((formTag) => {
      const [, formData, relay, secretData] = formTag;
      const [formPubkey, formId] = formData.split(":");
      const [secretKey, viewKey] = secretData.split(":");

      const event = events.find((e) => e.pubkey === formPubkey);
      if (!event) return;

      next.set(formId, {
        event,
        secrets: { secretKey, viewKey },
        relay,
      });
    });

    setFormEvents(next);
  };

  const inMyForms = (formPubkey: string, formId: string) => {
    const entry = formEvents.get(formId);
    if (!entry) return false;
    return entry.event.pubkey === formPubkey;
  };

  const saveToMyForms = async (
    formAuthorPub: string,
    formAuthorSecret: string,
    formId: string,
    relays: string[],
    viewKey?: string,
    callback?: (state: "saving" | "saved" | null) => void,
  ) => {
    if (!userPub) return;

    callback?.("saving");
    const targetRelays = relays.length ? relays : getDefaultRelays();

    try {
      const signer = await signerManager.getSigner();

      const existing = await pool.get(targetRelays, {
        kinds: [KINDS.myFormsList],
        authors: [userPub],
      });

      let forms: Tag[] = [];

      if (existing) {
        const decrypted = await signer.nip44Decrypt!(userPub, existing.content);
        forms = JSON.parse(decrypted);
      }

      const key = `${formAuthorPub}:${formId}`;
      if (forms.some((f) => f[1] === key)) {
        callback?.("saved");
        return;
      }

      let secrets = formAuthorSecret;
      if (viewKey) secrets += `:${viewKey}`;

      forms.push(["f", key, targetRelays[0], secrets]);

      const encrypted = await signer.nip44Encrypt!(
        userPub,
        JSON.stringify(forms),
      );

      const event = await signer.signEvent({
        kind: KINDS.myFormsList,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: encrypted,
      });

      await Promise.allSettled(pool.publish(targetRelays, event));

      await refreshForms(true); // 🔥 force refresh to sync state
      callback?.("saved");
    } catch (err) {
      console.error("saveToMyForms failed:", err);
      callback?.(null);
    }
  };

  const refreshForms = async (force = false) => {
    if (!userPub) return;
    // Prevent duplicate concurrent refreshes
    if (isRefreshingRef.current) return;
    // Skip if already loaded for this user (unless forced)
    if (!force && loadedForPubRef.current === userPub) return;

    isRefreshingRef.current = true;
    setRefreshing(true);

    try {
      const signer = await signerManager.getSigner();

      const list = await pool.get(getDefaultRelays(), {
        kinds: [14083],
        authors: [userPub],
      });

      if (!list) {
        setFormEvents(new Map());
        loadedForPubRef.current = userPub;
        return;
      }

      const decrypted = await signer.nip44Decrypt!(userPub, list.content);

      await fetchFormEvents(JSON.parse(decrypted));
      loadedForPubRef.current = userPub;
    } catch (err) {
      console.error("Error loading forms:", err);
      // Don't mark as loaded on error - allow retry
    } finally {
      isRefreshingRef.current = false;
      setRefreshing(false);
    }
  };

  const deleteForm = async (formId: string, formPubkey: string) => {
    if (!userPub) return;

    setRefreshing(true);

    try {
      const signer = await signerManager.getSigner();

      const list = await pool.get(getDefaultRelays(), {
        kinds: [14083],
        authors: [userPub],
      });

      if (!list) return;

      const forms: Tag[] = JSON.parse(
        await signer.nip44Decrypt!(userPub, list.content),
      );

      const updatedForms = forms.filter((f) => {
        const [pub, id] = f[1].split(":");
        return !(pub === formPubkey && id === formId);
      });

      const event = await signer.signEvent({
        kind: 14083,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: await signer.nip44Encrypt!(
          userPub,
          JSON.stringify(updatedForms),
        ),
      });

      pool.publish(getDefaultRelays(), event);
      await refreshForms(true); // Force refresh after delete
    } catch (err) {
      console.error("Error deleting form:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh when userPub changes
  useEffect(() => {
    refreshForms();
  }, [userPub]);

  // Also refresh when signer becomes available (handles race condition on startup)
  useEffect(() => {
    const unsubscribe = signerManager.onChange(() => {
      // Signer state changed - refresh if we have a pubkey
      if (userPub) {
        refreshForms();
      }
    });
    return () => {
      unsubscribe();
    };
  }, [userPub]);

  return (
    <MyFormsContext.Provider
      value={{
        formEvents,
        refreshing,
        refreshForms,
        deleteForm,
        saveToMyForms,
        inMyForms,
      }}
    >
      {children}
    </MyFormsContext.Provider>
  );
};
