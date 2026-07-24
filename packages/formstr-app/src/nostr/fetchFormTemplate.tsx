import { Event } from "nostr-tools";
import { getDefaultRelays } from "./common";
import { subscribe, type Subscription } from "../dataLayer";

const templateFilter = (pubKey: string, formIdentifier: string) => ({
  kinds: [30168],
  authors: [pubKey],
  "#d": [formIdentifier],
});

/**
 * Live subscription to a form template (kind 30168). Returns a `close()`-able
 * handle so the caller can keep it alive for the component's lifetime — a STABLE
 * subscription is what makes the local-relay worker's async delivery reliable
 * (a one-shot observe-then-unobserve can race the worker's fanout and miss the
 * event). `relays` are read-relay hints (a form's naddr relays) folded into
 * routing, so the fetch reaches them even without the author's kind-10002 outbox.
 */
export const subscribeFormTemplate = (
  pubKey: string,
  formIdentifier: string,
  onEvent: (event: Event) => void,
  relays?: string[]
): Subscription => {
  const relayList = relays?.length ? relays : getDefaultRelays();
  return subscribe([templateFilter(pubKey, formIdentifier)], onEvent, relayList);
};

/**
 * One-shot fetch of a form template — delivers the first match, then drops the
 * interest. For fire-and-forget callers (import, fill-page bootstrap) that don't
 * hold a subscription. Latency-sensitive views should prefer
 * {@link subscribeFormTemplate} and keep it alive.
 */
export const fetchFormTemplate = async (
  pubKey: string,
  formIdentifier: string,
  onEvent: (event: Event) => void,
  relays?: string[]
): Promise<void> => {
  const relayList = relays?.length ? relays : getDefaultRelays();
  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      sub.close();
      resolve();
    };
    const sub = subscribe(
      [templateFilter(pubKey, formIdentifier)],
      (event: Event) => {
        if (done) return;
        onEvent(event);
        finish();
      },
      relayList,
    );
    const timer = setTimeout(finish, 15000);
  });
};
