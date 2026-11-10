import { Event } from "nostr-tools";
import { subscribe, type Subscription } from "../dataLayer";

export const getPublicForms = (
  relays: string[],
  callback: (event: Event) => void,
): Subscription => {
  const filter = {
    kinds: [30168],
    limit: 50,
    "#t": ["public"],
  };
  return subscribe([filter], callback, relays);
};
