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

/**
 * Cap on how many seen-event ids we retain per scope. The DataLayer worker
 * caches matching events in IndexedDB and replays the whole set on every
 * subscription mount, so these dedup arrays would otherwise grow without bound
 * and blow the localStorage quota (each id is a 64-char hex string, and the
 * map holds one entry PER scope — device + every signed-in pubkey). Keeping the
 * most-recent ids (Set insertion order ≈ first-seen order, newest at the tail)
 * bounds the payload; an evicted old id can at worst re-notify once if the same
 * ancient event is redelivered. With the 30-day notification window this is far
 * more than enough headroom.
 */
const MAX_DEDUP_IDS = 1000;

const capTail = (ids: string[], max: number = MAX_DEDUP_IDS): string[] =>
  ids.length > max ? ids.slice(-max) : ids;

const cappedScope = (
  state: NotificationsDedupState,
  max: number = MAX_DEDUP_IDS,
): NotificationsDedupState => ({
  ...state,
  knownShareKeys: capTail(state.knownShareKeys, max),
  knownResponseIds: capTail(state.knownResponseIds, max),
});

export function saveDedupState(
  scopeKey: string,
  state: NotificationsDedupState,
) {
  const all =
    getItem<Record<string, NotificationsDedupState>>(
      LOCAL_STORAGE_KEYS.NOTIFICATIONS_STATE,
    ) ?? {};

  // Self-healing write: if the quota is already full, shrink this scope's id
  // arrays progressively and retry so the dedup state can never wedge the whole
  // app's localStorage (which would silently break auth/profile persistence).
  for (const cap of [MAX_DEDUP_IDS, 500, 200, 50]) {
    const ok = setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS_STATE, {
      ...all,
      [scopeKey]: cappedScope(state, cap),
    });
    if (ok) return;
  }

  // Last resort: drop every other scope and keep only a minimal record for the
  // current one. Better to occasionally re-notify than to leave storage wedged.
  setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS_STATE, {
    [scopeKey]: cappedScope(state, 50),
  });
}

/**
 * Re-caps every stored scope to the current limits and rewrites the map. Run
 * once on load so users whose state predates the tighter cap (or ballooned
 * before the 30-day window existed) reclaim localStorage immediately, without
 * having to clear storage by hand.
 */
export function compactDedupState(): void {
  const all = getItem<Record<string, NotificationsDedupState>>(
    LOCAL_STORAGE_KEYS.NOTIFICATIONS_STATE,
  );
  if (!all) return;
  const compacted: Record<string, NotificationsDedupState> = {};
  for (const [scope, state] of Object.entries(all)) {
    compacted[scope] = cappedScope(state);
  }
  setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS_STATE, compacted);
}
