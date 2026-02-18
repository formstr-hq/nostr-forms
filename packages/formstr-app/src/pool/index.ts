import { EventTemplate, Filter, SimplePool, VerifiedEvent, Event } from "nostr-tools";
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

class AuthedPool extends SimplePool {
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
  ) {
    return super.publish(relays, event, {
      onauth: makeWriteOnAuth(),
      ...options,
    });
  }
}

export const pool = new AuthedPool();
