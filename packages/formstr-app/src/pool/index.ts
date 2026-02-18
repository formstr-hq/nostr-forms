import {
  EventTemplate,
  Filter,
  SimplePool,
  VerifiedEvent,
  Event,
} from "nostr-tools";
import { normalizeURL } from "nostr-tools/utils";
import { AbstractRelay } from "nostr-tools/abstract-relay";
import { SubscribeManyParams } from "nostr-tools/abstract-pool";
import { signerManager } from "../signer";

const makeReadOnAuth = () => async (ev: EventTemplate): Promise<VerifiedEvent> => {
  const signer = signerManager.getSignerIfAvailable();
  if (!signer) throw new Error("no signer for auth");
  return (await signer.signEvent(ev)) as VerifiedEvent;
};

const makeWriteOnAuth = () => async (ev: EventTemplate): Promise<VerifiedEvent> => {
  const signer = await signerManager.getSigner();
  return (await signer.signEvent(ev)) as VerifiedEvent;
};

const pendingAuthTimers = new WeakMap<AbstractRelay, ReturnType<typeof setTimeout>>();

function patchRelayAuth(relay: AbstractRelay) {
  const ws = (relay as any).ws;
  if (!ws) return;
  // ws.onmessage is set to this._onmessage.bind(this) during connect(), so
  // patching relay._onmessage has no effect. We must replace ws.onmessage.
  const original = ws.onmessage;
  ws.onmessage = (ev: MessageEvent) => {
    original(ev);
    try {
      const message = JSON.parse(ev.data);
      if (Array.isArray(message) && message[0] === "AUTH") {
        // Debounce: the relay may send one AUTH per REQ in quick succession.
        // Each one overwrites relay.challenge, but authPromise is cached after
        // the first relay.auth() call, so we'd respond to a stale challenge.
        // Wait 50ms to let all challenges arrive, then respond only to the last.
        const existing = pendingAuthTimers.get(relay);
        if (existing) clearTimeout(existing);
        pendingAuthTimers.set(
          relay,
          setTimeout(() => {
            pendingAuthTimers.delete(relay);
            (relay as any).authPromise = undefined; // reset so auth uses latest challenge
            relay.auth(makeReadOnAuth())
              .then(() => {
                // Re-fire all open subscriptions so the relay processes them
                // now that the connection is authenticated.
                relay.openSubs.forEach((sub) => sub.fire());
              })
              .catch(() => {});
          }, 50)
        );
      }
    } catch {}
  };
}

class AuthedPool extends SimplePool {
  async ensureRelay(
    url: string,
    params?: { connectionTimeout?: number }
  ): Promise<AbstractRelay> {
    const isNew = !this.relays.has(normalizeURL(url));
    const relay = await super.ensureRelay(url, params);
    if (isNew) patchRelayAuth(relay);
    return relay;
  }

  subscribeMany(
    relays: string[],
    filters: Filter[],
    params: SubscribeManyParams
  ) {
    return super.subscribeMany(relays, filters, {
      onauth: makeReadOnAuth(),
      ...params,
    });
  }

  subscribeEose(
    relays: string[],
    filter: Filter,
    params: Pick<
      SubscribeManyParams,
      "label" | "id" | "onevent" | "onclose" | "maxWait" | "onauth" | "doauth"
    >
  ) {
    return super.subscribeEose(relays, filter, {
      onauth: makeReadOnAuth(),
      ...params,
    });
  }

  publish(
    relays: string[],
    event: Event,
    options?: { onauth?: (evt: EventTemplate) => Promise<VerifiedEvent> }
  ): Promise<string>[] {
    return relays.map((url) => this._publishToRelay(url, event));
  }

  private async _publishToRelay(url: string, event: Event): Promise<string> {
    const relay = await this.ensureRelay(url);
    try {
      return await relay.publish(event);
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      const isAuthError =
        msg.startsWith("auth-required:") || msg.includes("unauthorized");
      if (!isAuthError) throw err;
      // Relay rejected — wait briefly for the AUTH challenge frame to arrive.
      await new Promise((r) => setTimeout(r, 200));
      await relay.auth(makeWriteOnAuth());
      return await relay.publish(event);
    }
  }
}

export const pool = new AuthedPool();
