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
import { getDefaultRelays, customPublish } from "../nostr/common";
import { subscribe, fetchOne, fetchMany } from "../dataLayer";
import { signerManager } from "../signer";

/* ----------------------------- Types ----------------------------- */

type FormEventMetadata = {
  event: Event | null;
  secrets: { secretKey: string; viewKey?: string };
  relay: string;
  formPubkey: string;
  formId: string;
};

type MyFormsContextValue = {
  formEvents: Map<string, FormEventMetadata>;
  refreshing: boolean;
  refreshForms: (force?: boolean) => Promise<void>;
  retryForm: (formId: string) => Promise<void>;
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
  // Tracked per-pubkey (not a single shared boolean) so a fetch in flight
  // for one account can never block or get clobbered by a fetch for a
  // different one — see refreshForms for why this matters.
  const inFlightForRef = useRef<string | null>(null);
  const loadedForPubRef = useRef<string | null>(null);
  const latestPubRef = useRef<string | undefined>(userPub);
  latestPubRef.current = userPub;
  const fetchSubRef = useRef<{ close: () => void } | null>(null);

  const fetchFormEvents = (forms: unknown) => {
    fetchSubRef.current?.close();

    const initial = new Map<string, FormEventMetadata>();
    const formLookup = new Map<string, string>();
    const list = Array.isArray(forms) ? forms : [];
    for (const formTag of list) {
      if (
        !Array.isArray(formTag) ||
        formTag[0] !== "f" ||
        typeof formTag[1] !== "string"
      )
        continue;
      const formData = formTag[1] as string;
      const relay = typeof formTag[2] === "string" ? formTag[2] : "";
      const secretData = typeof formTag[3] === "string" ? formTag[3] : "";
      const [formPubkey, formId] = formData.split(":");
      if (!formPubkey || !formId) continue;
      const [secretKey = "", viewKey] = secretData.split(":");
      initial.set(formId, {
        event: null,
        secrets: { secretKey, viewKey },
        relay,
        formPubkey,
        formId,
      });
      formLookup.set(`${formPubkey}:${formId}`, formId);
    }
    setFormEvents(initial);

    if (initial.size === 0) return;

    const dTags = [...initial.values()].map((v) => v.formId);
    const pubkeys = [...initial.values()].map((v) => v.formPubkey);

    fetchSubRef.current = subscribe(
      [{ kinds: [30168], "#d": dTags, authors: pubkeys }],
      (event) => {
        const dTag = event.tags.find((t) => t[0] === "d")?.[1];
        if (!dTag) return;
        const formId = formLookup.get(`${event.pubkey}:${dTag}`);
        if (!formId) return;
        setFormEvents((prev) => {
          const existing = prev.get(formId);
          if (!existing) return prev;
          const next = new Map(prev);
          next.set(formId, { ...existing, event });
          return next;
        });
      },
      getDefaultRelays(),
    );
  };

  const inMyForms = (formPubkey: string, formId: string) => {
    const entry = formEvents.get(formId);
    if (!entry) return false;
    return entry.formPubkey === formPubkey;
  };

  const retryForm = async (formId: string) => {
    const entry = formEvents.get(formId);
    if (!entry) return;

    const { formPubkey, relay } = entry;
    const relaysToTry = relay
      ? [...new Set([relay, ...getDefaultRelays()])]
      : getDefaultRelays();

    const events = await fetchMany(
      [
        {
          kinds: [30168],
          "#d": [formId],
          authors: [formPubkey],
        },
      ],
      relaysToTry,
      6000,
    );

    const event =
      events.find(
        (e) =>
          e.pubkey === formPubkey &&
          e.tags.some((t) => t[0] === "d" && t[1] === formId),
      ) ?? null;

    setFormEvents((prev) => {
      const next = new Map(prev);
      next.set(formId, { ...entry, event });
      return next;
    });
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

      const existing = await fetchOne(
        [{ kinds: [KINDS.myFormsList], authors: [userPub] }],
        targetRelays,
        6000,
      );

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

      await Promise.allSettled(customPublish(targetRelays, event));

      await refreshForms(true); // 🔥 force refresh to sync state
      callback?.("saved");
    } catch (err) {
      console.error("saveToMyForms failed:", err);
      callback?.(null);
    }
  };

  const refreshForms = async (force = false) => {
    if (!userPub) return;
    const targetPubkey = userPub;
    // Non-forced calls bail only if a fetch for THIS pubkey is already
    // running or its data is already fresh — never blocked by a fetch for
    // a different (e.g. just-switched-away-from) account.
    if (!force && inFlightForRef.current === targetPubkey) return;
    if (!force && loadedForPubRef.current === targetPubkey) return;

    inFlightForRef.current = targetPubkey;
    setRefreshing(true);

    try {
      const signer = await signerManager.getSigner();

      // Bounded so a slow/unreachable relay can't stall the whole list
      // (and, combined with the per-pubkey tracking above, can't block a
      // subsequent account switch either).
      const list = await fetchOne(
        [{ kinds: [14083], authors: [targetPubkey] }],
        getDefaultRelays(),
        6000,
      );

      // A different account has since become active — this result is
      // stale, don't let it clobber whatever's now current.
      if (latestPubRef.current !== targetPubkey) return;

      if (!list) {
        setFormEvents(new Map());
        loadedForPubRef.current = targetPubkey;
        return;
      }
      const decrypted = await signer.nip44Decrypt!(targetPubkey, list.content);
      if (latestPubRef.current !== targetPubkey) return;
      fetchFormEvents(JSON.parse(decrypted));
      loadedForPubRef.current = targetPubkey;
    } catch (err) {
      console.error("Error loading forms:", err);
      // Don't mark as loaded on error - allow retry
    } finally {
      if (inFlightForRef.current === targetPubkey) {
        inFlightForRef.current = null;
      }
      setRefreshing(false);
    }
  };

  const deleteForm = async (formId: string, formPubkey: string) => {
    if (!userPub) return;

    setRefreshing(true);

    try {
      const signer = await signerManager.getSigner();

      const list = await fetchOne(
        [{ kinds: [14083], authors: [userPub] }],
        getDefaultRelays(),
        6000,
      );

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

      customPublish(getDefaultRelays(), event);
      await refreshForms(true); // Force refresh after delete
    } catch (err) {
      console.error("Error deleting form:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => () => { fetchSubRef.current?.close(); }, []);

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
        retryForm,
        deleteForm,
        saveToMyForms,
        inMyForms,
      }}
    >
      {children}
    </MyFormsContext.Provider>
  );
};
