import { Event, SimplePool, nip19, nip44 } from "nostr-tools";
import { AddressPointer } from "nostr-tools/lib/types/nip19";
import { decodeNKeys } from "./nkeys.js";
import { Tag } from "../types.js";
import { hexToBytes } from "@noble/hashes/utils.js";
import { getDefaultRelays } from "../config.js";

export { getDefaultRelays };

const decryptFormEvent = (event: Event, nkeys?: string) => {
  if (!nkeys) return null;
  const { viewKey, editKey } = decodeNKeys(nkeys);
  if (!viewKey) return null;
  const conversationKey = nip44.v2.utils.getConversationKey(
    viewKey,
    event.pubkey,
  );
  return nip44.v2.decrypt(event.content, conversationKey);
};

export const fetchFormTemplate = async (
  naddr: string,
  nkeys?: string,
): Promise<Tag[] | null> => {
  const pool = new SimplePool();
  const { pubkey, kind, identifier, relays } = nip19.decode(naddr)
    .data as AddressPointer;

  let formIdPubkey = pubkey;
  let relayList = relays?.length ? relays : getDefaultRelays();
  const filter = {
    kinds: [30168],
    authors: [formIdPubkey],
    "#d": [identifier],
  };
  const nostrEvent = await pool.get(relayList, filter);
  if (!nostrEvent)
    throw Error(
      `Event not found on given relays: ${JSON.stringify(relayList)}`,
    );
  console.log("Nostr Event content is", nostrEvent?.tags);
  if (nostrEvent?.content === "") {
    const returnTags = [...nostrEvent.tags, ["pubkey", nostrEvent.pubkey]];
    return returnTags;
  }
  const decryptedEvent = decryptFormEvent(nostrEvent, nkeys);
  const nameTag = nostrEvent.tags.find((t) => t[0] === "name");
  const relayTags = nostrEvent.tags.filter((t) => t[0] === "relay");
  if (!decryptedEvent)
    throw Error(`Could not decrypt form with supplied keys: ${nkeys}`);
  let decryptedTags: Tag[];
  try {
    decryptedTags = JSON.parse(decryptedEvent);
  } catch {
    throw Error("Malformed Form Event, could not parse");
  }
  decryptedTags.push(...relayTags, ["pubkey", nostrEvent.pubkey]);
  return decryptedTags;
};
