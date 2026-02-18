import { Event, Filter } from "nostr-tools";
import { getDefaultRelays } from "./common";
import { SubCloser } from "nostr-tools/abstract-pool";
import { pool } from "../pool";

export const fetchFormResponses = (
  pubKey: string,
  formId: string,
  handleResponseEvent: (event: Event) => void,
  allowedPubkeys?: string[],
  relays?: string[]
): SubCloser => {
  let relayList = [...(relays || []), ...getDefaultRelays()];
  const filter: Filter = {
    kinds: [1069],
    "#a": [`30168:${pubKey}:${formId}`],
  };
  if (allowedPubkeys) filter.authors = allowedPubkeys;
  return pool.subscribeMany(relayList, [filter], {
    onevent: handleResponseEvent,
  });
};
