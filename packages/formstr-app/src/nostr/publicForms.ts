import { Event } from "nostr-tools";
import { SubCloser } from "nostr-tools/abstract-pool";
import { pool } from "../pool";

export const getPublicForms = (
  relays: string[],
  callback: (event: Event) => void
): SubCloser => {
  let filter = {
    kinds: [30168],
    limit: 50,
    "#t": ["public"],
  };
  return pool.subscribeMany(relays, [filter], {
    onevent: (e: Event) => {
      callback(e);
    },
  });
};
