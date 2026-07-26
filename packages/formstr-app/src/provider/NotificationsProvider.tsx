import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Event } from "nostr-tools";
import { useProfileContext } from "../hooks/useProfileContext";
import { useMyForms } from "./MyFormsProvider";
import { useLocalForms } from "./LocalFormsProvider";
import { getDefaultRelays } from "../nostr/common";
import { subscribe } from "../dataLayer";
import {
  INotification,
  getNotifications,
  recordNotification,
  markRead as persistMarkRead,
  markAllRead as persistMarkAllRead,
  getDedupState,
  saveDedupState,
  compactDedupState,
} from "../utils/notifications";

interface OwnedForm {
  formPubkey: string;
  formId: string;
  formName: string;
  relays: string[];
  secretKey: string;
  viewKey?: string;
  /** undefined = local-only form, no signed-in identity involved */
  ownerPubkey?: string;
}

interface NotificationsContextValue {
  notifications: INotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  findOwnedForm: (formPubkey: string, formId: string) => OwnedForm | undefined;
}

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

export const useNotifications = (): NotificationsContextValue => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider",
    );
  }
  return ctx;
};

const ownedFormKey = (formPubkey: string, formId: string) =>
  `${formPubkey}:${formId}`;

// Only surface notifications for activity in the last 30 days. Bounding the
// window also caps how many event ids the dedup state accumulates — the thing
// that was ballooning localStorage — instead of reaching a year+ back.
const NOTIFICATION_WINDOW_DAYS = 30;
const notificationSince = () =>
  Math.floor(Date.now() / 1000) - NOTIFICATION_WINDOW_DAYS * 24 * 60 * 60;

export const NotificationsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { pubkey } = useProfileContext();
  const { formEvents } = useMyForms();
  const { localForms } = useLocalForms();
  const [notifications, setNotifications] = useState<INotification[]>([]);

  const scopeKey = pubkey ?? "device";

  // Owned-forms discovery: union of the login-scoped My-Forms bookmark and
  // the device-wide Local Forms list (the latter is what makes response
  // notifications work with nobody signed in — see NotificationsProvider
  // plan notes). Deduped by formPubkey:formId; a form present in both wins
  // on the My-Forms side (it has an ownerPubkey once bookmarked).
  const ownedForms = useMemo(() => {
    const map = new Map<string, OwnedForm>();

    for (const form of localForms) {
      map.set(ownedFormKey(form.publicKey, form.formId), {
        formPubkey: form.publicKey,
        formId: form.formId,
        formName: form.name,
        relays: form.relays?.length
          ? form.relays
          : form.relay
          ? [form.relay]
          : [],
        secretKey: form.privateKey,
        viewKey: form.viewKey,
        ownerPubkey: undefined,
      });
    }

    for (const [formId, meta] of formEvents.entries()) {
      const key = ownedFormKey(meta.formPubkey, formId);
      const existing = map.get(key);
      const nameTag = meta.event?.tags.find((t) => t[0] === "name")?.[1];
      map.set(key, {
        formPubkey: meta.formPubkey,
        formId,
        formName: nameTag || existing?.formName || formId,
        relays: existing?.relays?.length
          ? existing.relays
          : meta.relay
          ? [meta.relay]
          : [],
        secretKey: meta.secrets.secretKey || existing?.secretKey || "",
        viewKey: meta.secrets.viewKey || existing?.viewKey,
        ownerPubkey: pubkey,
      });
    }

    return map;
  }, [localForms, formEvents, pubkey]);

  const ownedFormsKey = useMemo(
    () => Array.from(ownedForms.keys()).sort().join(","),
    [ownedForms],
  );

  const findOwnedForm = (formPubkey: string, formId: string) =>
    ownedForms.get(ownedFormKey(formPubkey, formId));

  // Reclaim any localStorage bloat from dedup state written before the tighter
  // caps / 30-day window existed, once per load.
  useEffect(() => {
    compactDedupState();
  }, []);

  // Reload the visible list whenever the active account changes.
  useEffect(() => {
    setNotifications(getNotifications(pubkey));
  }, [pubkey]);

  const responsesSubRef = useRef<{ close: () => void } | null>(null);
  const sharesSubRef = useRef<{ close: () => void } | null>(null);

  // Responses on owned forms — rebuilt whenever the owned-forms set changes.
  useEffect(() => {
    responsesSubRef.current?.close();
    responsesSubRef.current = null;
    if (ownedForms.size === 0) return;

    let active = true;
    const state = getDedupState(scopeKey);
    const knownResponseIds = new Set(state.knownResponseIds);
    let baselineSeeded = state.responseBaselineSeeded;
    let eosed = false;

    const persist = () => {
      saveDedupState(scopeKey, {
        ...getDedupState(scopeKey),
        knownResponseIds: Array.from(knownResponseIds),
        responseBaselineSeeded: baselineSeeded,
      });
    };

    const aValues = Array.from(ownedForms.values()).map(
      (f) => `30168:${f.formPubkey}:${f.formId}`,
    );

    const since = notificationSince();
    responsesSubRef.current = subscribe(
      [{ kinds: [1069], "#a": aValues, since }],
      (event: Event) => {
          // The DataLayer worker replays its whole IndexedDB cache, which can
          // include events older than `since`; drop them so neither the visible
          // list nor the dedup state reaches past the 30-day window.
          if (event.created_at < since) return;
          if (knownResponseIds.has(event.id)) return;
          knownResponseIds.add(event.id);

          if (!baselineSeeded) {
            persist();
            return;
          }

          const aTag = event.tags.find((t) => t[0] === "a")?.[1];
          const [, formPubkey, formId] = aTag?.split(":") ?? [];
          const owned =
            formPubkey && formId
              ? ownedForms.get(ownedFormKey(formPubkey, formId))
              : undefined;
          if (!owned) {
            persist();
            return;
          }

          const notification: INotification = {
            id: event.id,
            type: "response",
            formPubkey: owned.formPubkey,
            formId: owned.formId,
            formName: owned.formName,
            relays: owned.relays,
            createdAt: event.created_at,
            seenAt: null,
            ownerPubkey: owned.ownerPubkey,
          };
          recordNotification(notification);
          if (active) {
            setNotifications((prev) => [
              notification,
              ...prev.filter((n) => n.id !== notification.id),
            ]);
          }
          persist();
        },
        getDefaultRelays(),
        () => {
          if (eosed) return;
          eosed = true;
          baselineSeeded = true;
          persist();
        },
      );

    return () => {
      active = false;
      responsesSubRef.current?.close();
      responsesSubRef.current = null;
    };
  }, [ownedFormsKey, scopeKey]);

  // Shares — requires an identity to be tagged against, so login-only.
  useEffect(() => {
    sharesSubRef.current?.close();
    sharesSubRef.current = null;
    if (!pubkey) return;

    let active = true;
    const state = getDedupState(scopeKey);
    const knownShareKeys = new Set(state.knownShareKeys);
    let baselineSeeded = state.shareBaselineSeeded;
    let eosed = false;

    const persist = () => {
      saveDedupState(scopeKey, {
        ...getDedupState(scopeKey),
        knownShareKeys: Array.from(knownShareKeys),
        shareBaselineSeeded: baselineSeeded,
      });
    };

    const since = notificationSince();
    sharesSubRef.current = subscribe(
      [{ kinds: [30168], "#p": [pubkey], since }],
      (event: Event) => {
          if (event.created_at < since) return;
          const dTag = event.tags.find((t) => t[0] === "d")?.[1];
          if (!dTag) return;
          const key = ownedFormKey(event.pubkey, dTag);

          // Every form auto-p-tags its own creator — don't notify about
          // your own forms just because you're also their editor.
          if (ownedForms.has(key)) return;

          if (knownShareKeys.has(key)) return;
          knownShareKeys.add(key);

          if (!baselineSeeded) {
            persist();
            return;
          }

          const nameTag = event.tags.find((t) => t[0] === "name")?.[1];
          const relays = event.tags
            .filter((t) => t[0] === "relay")
            .map((t) => t[1]);

          const notification: INotification = {
            id: key,
            type: "share",
            formPubkey: event.pubkey,
            formId: dTag,
            formName: nameTag || dTag,
            relays,
            createdAt: event.created_at,
            seenAt: null,
            ownerPubkey: pubkey,
          };
          recordNotification(notification);
          if (active) {
            setNotifications((prev) => [
              notification,
              ...prev.filter((n) => n.id !== notification.id),
            ]);
          }
          persist();
        },
        getDefaultRelays(),
        () => {
          if (eosed) return;
          eosed = true;
          baselineSeeded = true;
          persist();
        },
      );

    return () => {
      active = false;
      sharesSubRef.current?.close();
      sharesSubRef.current = null;
    };
  }, [pubkey, scopeKey, ownedFormsKey]);

  useEffect(
    () => () => {
      responsesSubRef.current?.close();
      sharesSubRef.current?.close();
    },
    [],
  );

  const unreadCount = notifications.filter((n) => n.seenAt === null).length;

  const markRead = (id: string) => {
    persistMarkRead(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, seenAt: new Date().toISOString() } : n,
      ),
    );
  };

  const markAllRead = () => {
    persistMarkAllRead(pubkey);
    const seenAt = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.seenAt === null ? { ...n, seenAt } : n)),
    );
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        findOwnedForm,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
