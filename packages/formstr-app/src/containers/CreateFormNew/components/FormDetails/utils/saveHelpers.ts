import { ILocalForm } from "../../../providers/FormBuilder/typeDefs";
import { signerManager } from "../../../../../signer";
import {
  getLocalForms,
  setLocalForms,
} from "../../../../../utils/encryptedStorage";

/**
 * Persists a newly created/published form to on-device storage.
 *
 * Goes through the encryption-aware storage layer: when the user has local
 * storage encryption enabled, reads/writes must use the encrypted blob —
 * writing plaintext directly (the old behaviour) made the new form invisible
 * to the dashboard, which only decrypts the blob. Logged-out + encrypted
 * can't re-encrypt, so it falls back to the plaintext slot (same as before).
 */
export const saveToDevice = async (
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

  // Peek only — getSigner() would pop the login modal for anonymous users.
  const signer = signerManager.getSignerIfAvailable();
  let userPub: string | undefined;
  try {
    userPub = signer ? await signer.getPublicKey() : undefined;
  } catch {
    userPub = undefined;
  }

  const { forms: existing, error: readError } = await getLocalForms(
    signer,
    userPub,
  );
  if (readError) {
    console.error("saveToDevice: could not read stored forms:", readError);
  }
  const forms = existing ?? [];
  if (forms.some((form) => form.key === saveObject.key)) {
    callback();
    return;
  }

  const { error } = await setLocalForms(
    [...forms, saveObject],
    signer,
    userPub,
  );
  if (error) {
    console.error("saveToDevice: failed to persist form:", error);
  }
  callback();
};
