import { DEVICE_TYPE, DEVICE_WIDTH } from "../constants/index";
import { getItem, LOCAL_STORAGE_KEYS, setItem } from "./localStorage";
import { nip19 } from "nostr-tools";
import { encodeNKeys } from "./nkeys";
import { getDefaultRelays } from "../nostr/common";

export function makeTag(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export const downloadHTMLToDevice = (fileContent: string, name = "form") => {
  const blob = new Blob([fileContent], { type: "text/html" });

  // Create a temporary link element
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${name}.html`;

  // Programmatically click the link to trigger the download
  link.click();

  // Clean up the URL object
  URL.revokeObjectURL(link.href);
};

export const makeFormNAddr = (
  publicKey: string,
  formId: string,
  relaysEncode?: string[],
) => {
  return nip19.naddrEncode({
    pubkey: publicKey,
    identifier: formId,
    relays: relaysEncode || getDefaultRelays(),
    kind: 30168,
  });
};

export const naddrUrl = (
  publicKey: string,
  formId: string,
  relaysEncode?: string[],
  viewKey?: string | null,
  disablePreview = false,
) => {
  const base = `/f/${makeFormNAddr(
    publicKey,
    formId,
    relaysEncode || getDefaultRelays(),
  )}`;

  // OLD behavior
  if (!disablePreview) {
    return viewKey ? `${base}?viewKey=${viewKey}` : base;
  }

  // NEW behavior: encode hash
  if (!viewKey) return base;

  const nkey = encodeNKeys({ viewKey });
  return `${base}#${nkey}`;
};

export function constructDraftUrl(
  draft: { formSpec: unknown; tempId: string } | null,
) {
  if (!draft) {
    return;
  }
  let draftHash = window.btoa(encodeURIComponent(JSON.stringify(draft)));
  draftHash = window.encodeURIComponent(draftHash);
  const hostname = window.location.host;

  return `http://${hostname}/drafts/${draftHash}`;
}

export function constructResponseUrl(privateKey: string | null) {
  const hostname = window.location.host;
  return `http://${hostname}/r/${privateKey}/responses`;
}

export function copyToClipBoard(str: string) {
  navigator.clipboard.writeText(str);
}

export const getDeviceType = () => {
  const { innerWidth } = window;
  if (innerWidth <= DEVICE_WIDTH[DEVICE_TYPE.MOBILE]) {
    return DEVICE_TYPE.MOBILE;
  } else if (innerWidth <= DEVICE_WIDTH[DEVICE_TYPE.TABLET]) {
    return DEVICE_TYPE.TABLET;
  } else {
    return DEVICE_TYPE.DESKTOP;
  }
};

export const isMobile = () => getDeviceType() === DEVICE_TYPE.MOBILE;
export const isTablet = () => getDeviceType() === DEVICE_TYPE.TABLET;
export const isDesktop = () => getDeviceType() === DEVICE_TYPE.DESKTOP;

export function appendClass(class1: string, class2: string) {
  if (class1) {
    return class1 + " " + class2;
  }
  return class1 + class2;
}

export function classNames(...classNames: any) {
  let classes = "";
  for (let i = 0; i < classNames.length; i++) {
    const arg = arguments[i];
    if (arg) {
      if (typeof arg === "string") {
        classes = appendClass(classes, arg);
      }
      if (typeof arg !== "object") {
        continue;
      }
      // eslint-disable-next-line no-loop-func
      Object.keys(arg).forEach((v) => {
        if (arg[v]) {
          classes = appendClass(classes, v);
        }
      });
    }
  }

  return classes;
}

export const deleteDraft = (formTempId: string) => {
  type Draft = { formSpec: unknown; tempId: string };
  let draftArr = getItem<Draft[]>(LOCAL_STORAGE_KEYS.DRAFT_FORMS) || [];
  draftArr = draftArr.filter((draft: Draft) => draft.tempId !== formTempId);
  setItem(LOCAL_STORAGE_KEYS.DRAFT_FORMS, draftArr);
};
