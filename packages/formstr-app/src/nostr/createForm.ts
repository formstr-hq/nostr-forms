import { UnsignedEvent, generateSecretKey, getPublicKey } from "nostr-tools";
import { customPublish, getDefaultRelays, signEvent } from "./common";
import { IWrap, Tag } from "./types";
import { nip44Encrypt } from "./utils";
import { grantAccess, sendWraps } from "./accessControl";
import { hexToBytes } from "@noble/hashes/utils.js";

const defaultRelays = getDefaultRelays();

interface MergedNpub {
  pubkey: string;
  isParticipant?: boolean;
  isEditor?: boolean;
}

const getMergedNpubs = (
  viewList: Set<string>,
  editList: Set<string>,
): MergedNpub[] => {
  let ViewNpubs = Array.from(viewList).map((hexPub) => {
    return {
      pubkey: hexPub,
      isParticipant: true,
    };
  });

  let EditNpubs = Array.from(editList).map((hexPub) => {
    return {
      pubkey: hexPub,
      isEditor: true,
    };
  });

  const map = new Map();
  ViewNpubs.forEach((item) => map.set(item.pubkey, item));
  EditNpubs.forEach((item) =>
    map.set(item.pubkey, { ...map.get(item.pubkey), ...item }),
  );
  return Array.from(map.values());
};

export const createForm = async (
  form: Array<Tag>,
  relayList: Array<string> = defaultRelays,
  viewList: Set<string>,
  EditList: Set<string>,
  encryptContent?: boolean,
  onRelayAccepted?: (url: string) => void,
  secretKey?: string | null,
  viewKeyParams?: string | null,
) => {
  let acceptedRelays: string[] = [];
  let signingKey: Uint8Array;
  let viewKey: Uint8Array;

  if (secretKey) signingKey = hexToBytes(secretKey);
  else signingKey = generateSecretKey();
  let formPubkey = getPublicKey(signingKey);

  if (viewKeyParams) viewKey = hexToBytes(viewKeyParams);
  else viewKey = generateSecretKey();

  let tags: Tag[] = [];
  let formId = form.find((tag: Tag) => tag[0] === "d")?.[1];
  if (!formId) {
    throw Error("Invalid Form: No formId found");
  }
  let name = form.find((tag: Tag) => tag[0] === "name")?.[1] || "";
  let mergedNpubs = getMergedNpubs(viewList, EditList);
  tags.push(["d", formId]);
  tags.push(["name", name]);
  let content = "";
  if (encryptContent)
    content = nip44Encrypt(
      signingKey,
      getPublicKey(viewKey),
      JSON.stringify(form),
    );
  else {
    tags = [
      ...tags,
      ...form.filter((tag: Tag) => !["d", "name"].includes(tag[0])),
    ];
    tags.push(["t", "public"]);
  }
  relayList.forEach((r: string) => tags.push(["relay", r]));
  const baseTemplateEvent: UnsignedEvent = {
    kind: 30168,
    created_at: Math.floor(Date.now() / 1000),
    tags: tags,
    content: content,
    pubkey: formPubkey,
  };
  let baseFormEvent = baseTemplateEvent;
  let wraps: IWrap[] = [];
  mergedNpubs.forEach((profile: MergedNpub) => {
    let wrap = grantAccess(
      baseFormEvent,
      profile.pubkey,
      signingKey,
      viewKey,
      profile.isEditor,
    );
    wraps.push(wrap);
    if (profile.isParticipant) {
      baseFormEvent.tags.push(["allowed", profile.pubkey]);
    }
    baseFormEvent.tags.push(["p", profile.pubkey]);
  });

  const templateEvent = await signEvent(baseTemplateEvent, signingKey);
  await sendWraps(wraps);
  await Promise.allSettled(
    customPublish(relayList, templateEvent!, (url: string) => {
      acceptedRelays.push(url);
      onRelayAccepted?.(url);
    }),
  );
  console.log("Accepted by relays", acceptedRelays);
  return {
    signingKey,
    viewKey: templateEvent.content !== "" ? viewKey : undefined,
    acceptedRelays,
  };
};
