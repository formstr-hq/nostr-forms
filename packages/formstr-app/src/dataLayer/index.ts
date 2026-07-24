import {
  DataLayer,
  LocalRelayClient,
  workerChannel,
  type Event,
  type Filter,
} from "@formstr/local-relay";
import type { EventTemplate } from "nostr-tools";
import { signerManager } from "../signer";
import { getDefaultRelays } from "../nostr/common";

/**
 * The app's single {@link DataLayer} — a NIP-01 Web Worker "local relay" that
 * owns every connection decision. Components/contexts declare interests
 * (`observe`) and `publish`; they never open sockets directly. Replaces the
 * imperative `SimplePool` (`src/pool`).
 *
 * Initialised lazily on first {@link getDataLayer} call so importing this module
 * never spawns a worker (tests + SSR-safe). The worker is a ready-made entry
 * from the package (IndexedDB store + real sockets).
 */
let instance: DataLayer | null = null;

/**
 * Sign a NIP-42 AUTH (or any worker-initiated) template. Read auth must not pop
 * a login modal, so we use whatever signer is already active and refuse (null)
 * when there is none — mirroring the old pool's read-auth behaviour.
 */
const signForAuth = async (
  template: EventTemplate,
): Promise<Event | null> => {
  const signer = signerManager.getSignerIfAvailable();
  if (!signer) return null;
  try {
    return (await signer.signEvent(template)) as Event;
  } catch {
    return null;
  }
};

/**
 * Sign a template for publishing. Publishing may prompt login (write auth), so
 * this uses `getSigner()` which resolves the login flow when needed.
 */
const signForPublish = async (template: EventTemplate): Promise<Event> => {
  const signer = await signerManager.getSigner();
  return (await signer.signEvent(template)) as Event;
};

const createInstance = (): DataLayer => {
  const worker = new Worker(
    new URL("@formstr/local-relay/worker", import.meta.url),
  );
  const client = new LocalRelayClient(workerChannel(worker), {
    onSignRequest: signForAuth,
  });

  client.setUserRelays(getDefaultRelays());

  const dataLayer = new DataLayer({ client, sign: signForPublish });

  // Keep the worker's scope pointed at the active account, retargeting it only
  // when the pubkey actually changes. signerManager fires several notifies on a
  // single login/unlock (unlock → activateCurrent → …); calling setActiveAccount
  // on each would re-scope the worker repeatedly and churn live subscriptions —
  // which delayed in-flight reads (e.g. viewing responses right after sign-in).
  let lastActivePubkey: string | null | undefined = undefined;
  const applyActiveAccount = () => {
    const pubkey = signerManager.getActiveAccount()?.pubkey ?? null;
    if (pubkey === lastActivePubkey) return;
    lastActivePubkey = pubkey;
    dataLayer.setActiveAccount(pubkey);
  };
  applyActiveAccount();
  signerManager.onChange(applyActiveAccount);

  return dataLayer;
};

/** The shared DataLayer, created on first use. */
export const getDataLayer = (): DataLayer => {
  if (!instance) {
    instance = createInstance();
  }
  return instance;
};

/** A disposable subscription — the `close()`-shaped twin of an ObserveHandle. */
export interface Subscription {
  close: () => void;
}

/**
 * Declare a live interest — the migration replacement for `pool.subscribeMany`.
 * Any `relays` the caller knows hold the data (e.g. a form's naddr relays) are
 * passed as per-interest read-relay HINTS, which the worker folds into routing
 * for this read (author-scoped and author-less alike) — no global gossip-pool
 * mutation. Returns a `close()`-able handle.
 */
export const subscribe = (
  filters: Filter[],
  onEvent: (event: Event) => void,
  relays?: string[],
  onEose?: () => void,
): Subscription => {
  const handle = getDataLayer().observe(filters, { onEvent, onEose }, { relays });
  return { close: () => handle.unobserve() };
};

/**
 * Update the relays the worker reads from (routing-policy input). Called once
 * the user's relay list is known (e.g. from their kind:10002).
 */
export const setUserRelays = (relays: string[]): void => {
  getDataLayer().setUserRelays(relays);
};

/**
 * Timing for one-shot reads. The DataLayer's `onEose` marks the end of the
 * LOCAL cache replay, NOT the network — live events arrive via `onEvent` AFTER
 * it. So a one-shot read must NOT simply resolve on `onEose` (on a cold/empty
 * cache that fires immediately with nothing, missing the network entirely —
 * what left "My Forms" perpetually empty). But it also must not always wait the
 * full hard timeout, or reads that legitimately match nothing (e.g. a fresh
 * account with no kind-10002) would tie up the worker for seconds and starve
 * concurrent reads. So:
 *   - once matches arrive, settle a short debounce after the last one;
 *   - on cache EOSE with NO match yet, wait a bounded network window, then give
 *     up (resolve empty) rather than blocking to the hard timeout.
 */
const FETCH_SETTLE_MS = 500;
const FETCH_NETWORK_GRACE_MS = 2500;

/**
 * One-shot network read of the newest event matching `filters` — the migration
 * replacement for `pool.get`. Waits for the network (not just the cache), but
 * bounds the wait when nothing matches. Resolves the newest match, or null.
 */
export const fetchOne = (
  filters: Filter[],
  relays?: string[],
  timeoutMs = 8000,
): Promise<Event | null> => {
  return new Promise((resolve) => {
    const dl = getDataLayer();
    let best: Event | null = null;
    let settled = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimer);
      if (settleTimer) clearTimeout(settleTimer);
      handle.unobserve();
      resolve(best);
    };
    const handle = dl.observe(
      filters,
      {
        onEvent: (event) => {
          if (!best || event.created_at > best.created_at) best = event;
          if (settleTimer) clearTimeout(settleTimer);
          settleTimer = setTimeout(finish, FETCH_SETTLE_MS);
        },
        onEose: () => {
          // Cache replay done. If nothing matched, wait only a bounded window for
          // the network before giving up; if a cached match exists, its settle
          // timer already governs (and a fresher live version can still extend it).
          if (!best && !settleTimer) {
            settleTimer = setTimeout(finish, FETCH_NETWORK_GRACE_MS);
          }
        },
      },
      { relays },
    );
    const hardTimer = setTimeout(finish, timeoutMs);
  });
};

/**
 * One-shot network read of all events matching `filters` — the migration
 * replacement for `pool.querySync`. Same bounded wait-for-network as
 * {@link fetchOne}, then resolves every match seen.
 */
export const fetchMany = (
  filters: Filter[],
  relays?: string[],
  timeoutMs = 8000,
): Promise<Event[]> => {
  return new Promise((resolve) => {
    const dl = getDataLayer();
    const byId = new Map<string, Event>();
    let settled = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimer);
      if (settleTimer) clearTimeout(settleTimer);
      handle.unobserve();
      resolve(Array.from(byId.values()));
    };
    const handle = dl.observe(
      filters,
      {
        onEvent: (event) => {
          byId.set(event.id, event);
          if (settleTimer) clearTimeout(settleTimer);
          settleTimer = setTimeout(finish, FETCH_SETTLE_MS);
        },
        onEose: () => {
          if (byId.size === 0 && !settleTimer) {
            settleTimer = setTimeout(finish, FETCH_NETWORK_GRACE_MS);
          }
        },
      },
      { relays },
    );
    const hardTimer = setTimeout(finish, timeoutMs);
  });
};

export { type Event, type Filter } from "@formstr/local-relay";
