import { Event, Filter } from "nostr-tools";
import { getDefaultRelays } from "./common";
import { subscribe, type Subscription } from "../dataLayer";

export const fetchFormResponses = (
  pubKey: string,
  formId: string,
  handleResponseEvent: (event: Event) => void,
  allowedPubkeys?: string[],
  relays?: string[]
): Subscription => {
  let relayList = [...(relays || []), ...getDefaultRelays()];
  const filter: Filter = {
    kinds: [1069],
    "#a": [`30168:${pubKey}:${formId}`],
  };
  if (allowedPubkeys) filter.authors = allowedPubkeys;
  return subscribe([filter], handleResponseEvent, relayList);
};
