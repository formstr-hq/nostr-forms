import { getItem, setItem, LOCAL_STORAGE_KEYS } from "./localStorage";

export type NotificationType = "response" | "share";

export interface INotification {
  id: string;
  type: NotificationType;
  formPubkey: string;
  formId: string;
  formName: string;
  relays: string[];
  createdAt: number;
  seenAt: string | null;
  /** undefined = device-wide (a local-only form, no signed-in identity involved) */
  ownerPubkey?: string;
}

const MAX_STORED_NOTIFICATIONS = 200;

export function getNotifications(pubkey?: string): INotification[] {
  const all = getItem<INotification[]>(LOCAL_STORAGE_KEYS.NOTIFICATIONS) ?? [];
  return all.filter(
    (n) => n.ownerPubkey === undefined || n.ownerPubkey === pubkey,
  );
}

/** Idempotent on id, so relay resends don't duplicate entries. */
export function recordNotification(notification: INotification) {
  const all = getItem<INotification[]>(LOCAL_STORAGE_KEYS.NOTIFICATIONS) ?? [];
  if (all.some((n) => n.id === notification.id)) return;
  const next = [notification, ...all].slice(0, MAX_STORED_NOTIFICATIONS);
  setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS, next);
}

export function markRead(id: string) {
  const all = getItem<INotification[]>(LOCAL_STORAGE_KEYS.NOTIFICATIONS) ?? [];
  const seenAt = new Date().toISOString();
  setItem(
    LOCAL_STORAGE_KEYS.NOTIFICATIONS,
    all.map((n) => (n.id === id ? { ...n, seenAt } : n)),
  );
}

export function markAllRead(pubkey?: string) {
  const all = getItem<INotification[]>(LOCAL_STORAGE_KEYS.NOTIFICATIONS) ?? [];
  const seenAt = new Date().toISOString();
  setItem(
    LOCAL_STORAGE_KEYS.NOTIFICATIONS,
    all.map((n) =>
      n.seenAt === null &&
      (n.ownerPubkey === undefined || n.ownerPubkey === pubkey)
        ? { ...n, seenAt }
        : n,
    ),
  );
}

/**
 * Dedup bookkeeping for the two live subscriptions in NotificationsProvider:
 * which share/response events have already been seen (so replayed or
 * re-published-on-edit events don't re-notify), and whether the initial
 * historical backlog for a given scope has been baseline-seeded yet (so
 * first load doesn't flood in every past share/response as "new").
 * Scoped by `pubkey ?? "device"` since responses on a local-only form have
 * no signed-in identity to key off of.
 */
export interface NotificationsDedupState {
  knownShareKeys: string[];
  knownResponseIds: string[];
  // Separate flags: the share and response subscriptions reach their own
  // EOSE independently, so a single shared flag would let whichever one
  // finishes first prematurely un-gate the other's still-unseeded backlog.
  shareBaselineSeeded: boolean;
  responseBaselineSeeded: boolean;
}

const emptyDedupState = (): NotificationsDedupState => ({
  knownShareKeys: [],
  knownResponseIds: [],
  shareBaselineSeeded: false,
  responseBaselineSeeded: false,
});

export function getDedupState(scopeKey: string): NotificationsDedupState {
  const all =
    getItem<Record<string, NotificationsDedupState>>(
      LOCAL_STORAGE_KEYS.NOTIFICATIONS_STATE,
    ) ?? {};
  return all[scopeKey] ?? emptyDedupState();
}

export function saveDedupState(
  scopeKey: string,
  state: NotificationsDedupState,
) {
  const all =
    getItem<Record<string, NotificationsDedupState>>(
      LOCAL_STORAGE_KEYS.NOTIFICATIONS_STATE,
    ) ?? {};
  setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS_STATE, {
    ...all,
    [scopeKey]: state,
  });
}
