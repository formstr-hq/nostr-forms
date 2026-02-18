import { UnsignedEvent } from "nostr-tools";
import {
  getItem,
  LOCAL_STORAGE_KEYS,
  setItem,
} from "../../../../../utils/localStorage";
import { ILocalForm } from "../../../providers/FormBuilder/typeDefs";
import { getDefaultRelays } from "../../../../../nostr/common";
import { KINDS, Tag } from "../../../../../nostr/types";
import { signerManager } from "../../../../../signer";

export const saveToDevice = (
  formAuthorPub: string,
  formAuthorSecret: string,
  formId: string,
  name: string,
  relays: string[],
  callback: () => void,
  viewKey?: string,
) => {
  let saveObject: ILocalForm = {
    key: `${formAuthorPub}:${formId}`,
    publicKey: `${formAuthorPub}`,
    privateKey: `${formAuthorSecret}`,
    name: name,
    formId: formId,
    relay: relays[0],
    relays: relays,
    createdAt: new Date().toString(),
  };
  if (viewKey) saveObject.viewKey = viewKey;
  let forms = getItem<Array<ILocalForm>>(LOCAL_STORAGE_KEYS.LOCAL_FORMS) || [];
  const existingKeys = forms.map((form) => form.key);
  if (existingKeys.includes(saveObject.key)) {
    callback();
    return;
  }
  forms.push(saveObject);
  setItem(LOCAL_STORAGE_KEYS.LOCAL_FORMS, forms);
  callback();
};
