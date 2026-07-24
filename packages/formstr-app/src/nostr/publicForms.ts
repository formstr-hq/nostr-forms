import { Event } from "nostr-tools";
import { subscribe } from "../dataLayer";

export const getPublicForms = (
  relays: string[],
  callback: (event: Event) => void
) => {
  let filter = {
    kinds: [30168],
    limit: 50,
    "#t": ["public"],
  };
  subscribe([filter], callback, relays);
};
