import { Event } from "nostr-tools";
import { getDefaultRelays } from "./common";
import { pool } from "../pool";

export const fetchFormTemplate = async (
  pubKey: string,
  formIdentifier: string,
  onEvent: (event: Event) => void,
  relays?: string[]
): Promise<void> => {
  let relayList = relays?.length ? relays : getDefaultRelays();
  const filter = {
    kinds: [30168],
    authors: [pubKey],
    "#d": [formIdentifier],
  };
  const subCloser = pool.subscribeMany(relayList, [filter], {
    onevent: (event: Event) => {
      onEvent(event);
      subCloser.close();
    },
  });
};
