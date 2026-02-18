import { Event } from "nostr-tools";
import { pool } from "../pool";

export const getPublicForms = (
  relays: string[],
  callback: (event: Event) => void
) => {
  let filter = {
    kinds: [30168],
    limit: 50,
    "#t": ["public"],
  };
  pool.subscribeMany(relays, [filter], {
    onevent: (e: Event) => {
      callback(e);
    },
  });
};
