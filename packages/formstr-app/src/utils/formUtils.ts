import { FormTemplate } from "../templates";
import { makeFormNAddr, makeTag } from "./utility";
import {
  nip44,
  Event,
  UnsignedEvent,
  nip19,
  getPublicKey,
} from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { sha256 } from "@noble/hashes/sha256";
import { naddrUrl } from "./utility";
import { AddressPointer } from "nostr-tools/nip19";
import { fetchFormTemplate } from "../nostr/fetchFormTemplate";
import { signerManager } from "../signer";
import { encodeNKeys } from "./nkeys";
import { getDefaultRelays } from "../nostr/common";
import { Tag } from "../nostr/types";
import { pool } from "../pool";

export const createFormSpecFromTemplate = (
  template: FormTemplate,
): { spec: Tag[]; id: string } => {
  const newFormInstanceId = makeTag(6);
  const spec: Tag[] = [
    ["d", newFormInstanceId],
    ["name", template.initialState.formName],
    ["settings", JSON.stringify(template.initialState.formSettings)],
    ...(template.initialState.questionsList as Tag[]),
  ];
  return { spec, id: newFormInstanceId };
};

export const fetchKeys = async (
  formAuthor: string,
  formId: string,
  userPub: string,
) => {
  const signer = await signerManager.getSigner();
  const defaultRelays = getDefaultRelays();
  const aliasPubKey = bytesToHex(
    sha256(`${30168}:${formAuthor}:${formId}:${userPub}`),
  );
  const giftWrapsFilter = {
    kinds: [1059],
    "#p": [aliasPubKey],
  };

  const accessKeyEvents = await pool.querySync(defaultRelays, giftWrapsFilter);
  let keys: Tag[] | undefined;
  await Promise.allSettled(
    accessKeyEvents.map(async (keyEvent: Event) => {
      try {
        const sealString = await signer.nip44Decrypt!(
          keyEvent.pubkey,
          keyEvent.content,
        );
        const seal = JSON.parse(sealString) as Event;
        const rumorString = await signer.nip44Decrypt!(
          seal.pubkey,
          seal.content,
        );
        const rumor = JSON.parse(rumorString) as UnsignedEvent;
        const key = rumor.tags;
        keys = key;
      } catch (e) {
        console.log("Error in decryption", e);
      }
    }),
  );
  return keys;
};

export function constructEmbeddedUrl(
  pubKey: string,
  formId: string,
  options: { [key: string]: boolean } = {},
  relays: string[],
  viewKey?: string,
) {
  const embeddedUrl = constructFormUrl(pubKey, formId, relays);

  const params = new URLSearchParams();
  if (viewKey) params.append("viewKey", viewKey);
  if (options.hideTitleImage) {
    params.append("hideTitleImage", "true");
  }
  if (options.hideDescription) {
    params.append("hideDescription", "true");
  }
  return params.toString()
    ? `${embeddedUrl}?${params.toString()}`
    : embeddedUrl;
}

export const getFormSpec = async (
  formEvent: Event,
  userPubKey?: string,
  onKeysFetched?: null | ((keys: Tag[] | null) => void),
  paramsViewKey?: string | null,
): Promise<Tag[] | null> => {
  const formId = formEvent.tags.find((t) => t[0] === "d")?.[1];
  if (!formId) {
    throw Error("Invalid Form: Does not have Id");
  }
  if (formEvent.content === "") {
    return formEvent.tags;
  } else {
    if (!userPubKey && !paramsViewKey) return null;
    let keys;
    if (paramsViewKey) {
      return getDecryptedForm(formEvent, paramsViewKey);
    }
    if (userPubKey)
      keys = await fetchKeys(formEvent.pubkey, formId, userPubKey);
    if (keys && onKeysFetched) onKeysFetched(keys || null);
    const viewKey = keys?.find((k) => k[0] === "ViewAccess")?.[1];
    if (!viewKey) return null;
    return getDecryptedForm(formEvent, viewKey);
  }
};

export const getDecryptedForm = (formEvent: Event, viewKey: string) => {
  const conversationKey = nip44.v2.utils.getConversationKey(
    hexToBytes(viewKey),
    formEvent.pubkey,
  );
  const formSpecString = nip44.v2.decrypt(formEvent.content, conversationKey);
  const FormTemplate = JSON.parse(formSpecString);
  return FormTemplate;
};

export const getAllowedUsers = (formEvent: Event) => {
  return formEvent.tags.filter((t) => t[0] === "allowed").map((t) => t[1]);
};

export const constructFormUrl = (
  pubkey: string,
  formId: string,
  relays: string[],
  viewKey?: string,
  disablePreview: boolean = false,
) => {
  const naddr = naddrUrl(pubkey, formId, relays, viewKey, disablePreview);
  const baseUrl = `${window.location.origin}${naddr}`;
  return baseUrl;
};

export const editPath = (
  formSecret: string,
  naddr: string,
  viewKey?: string | null,
  disablePreview = true,
) => {
  const base = `/edit/${naddr}`;

  if (!disablePreview) {
    const params = new URLSearchParams();
    if (viewKey) params.set("viewKey", viewKey);
    const query = params.toString() ? `?${params}` : "";
    return `${base}${query}#${formSecret}`;
  }

  // NEW: private links
  const nkey = encodeNKeys({
    ...(viewKey && { viewKey }),
    secretKey: formSecret,
  });

  return `${base}#${nkey}`;
};

export const responsePath = (
  secretKey: string,
  naddr: string,
  viewKey?: string | null,
  disablePreview = false, // true -> server-visible
) => {
  const base = `/s/${naddr}`;

  if (!disablePreview) {
    const params = new URLSearchParams();
    if (viewKey) params.set("viewKey", viewKey);
    const query = params.toString() ? `?${params.toString()}` : "";
    return `${base}${query}#${secretKey}`;
  }

  // Private: encode into nkeys
  const nkey = encodeNKeys({
    ...(viewKey ? { viewKey } : {}),
    secretKey,
  });

  return `${base}#${nkey}`;
};

export const constructNewResponseUrl = (
  secretKey: string,
  formId: string,
  relays?: string[],
  viewKey?: string,
  disablePreview: boolean = false,
) => {
  const baseUrl = `${window.location.origin}`;
  const responsePart = responsePath(
    secretKey,
    makeFormNAddr(getPublicKey(hexToBytes(secretKey)), formId, relays),
    viewKey,
    disablePreview,
  );
  return `${baseUrl}${responsePart}`;
};

export const getFormData = async (naddr: string) => {
  const decodedData = nip19.decode(naddr).data as AddressPointer;
  const pubKey = decodedData?.pubkey;
  const formId = decodedData?.identifier;
  const relays = decodedData?.relays;
  return new Promise((resolve) => {
    fetchFormTemplate(pubKey, formId, (event: Event) => {
      resolve(event);
    }, relays);
  });
};

export const getformstrBranding = (
  formSpec: Tag[] | null | undefined,
): boolean => {
  try {
    const settingsTag = formSpec?.find((t) => t[0] === "settings");
    if (!settingsTag || !settingsTag[1]) return true;

    const settingsJson = JSON.parse(settingsTag[1]);
    return settingsJson.formstrBranding !== undefined
      ? settingsJson.formstrBranding
      : true;
  } catch (error) {
    console.error("Failed to parse settings:", error);
    return true;
  }
};
