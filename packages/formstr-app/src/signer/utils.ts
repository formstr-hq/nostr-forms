import { generateSecretKey } from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

const LOCAL_APP_SECRET_KEY = "formstr:client-secret";
const LOCAL_BUNKER_URI = "formstr:bunkerUri";
const LOCAL_STORAGE_KEYS = "formstr:keys";
const LOCAL_NCRYPTSEC = "formstr:ncryptsec";

type BunkerUri = { bunkerUri: string };

type Keys = { pubkey: string; secret?: string };

export const getAppSecretKeyFromLocalStorage = () => {
  let hexSecretKey = localStorage.getItem(LOCAL_APP_SECRET_KEY);
  if (!hexSecretKey) {
    const newSecret = generateSecretKey();
    hexSecretKey = bytesToHex(newSecret);
    localStorage.setItem(LOCAL_APP_SECRET_KEY, hexSecretKey);
    return newSecret;
  }
  return hexToBytes(hexSecretKey);
};

export const getBunkerUriInLocalStorage = () => {
  return JSON.parse(
    localStorage.getItem(LOCAL_BUNKER_URI) || "{}"
  ) as BunkerUri;
};

export const getKeysFromLocalStorage = () => {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS) || "{}") as Keys;
};

export const setBunkerUriInLocalStorage = (bunkerUri: string) => {
  localStorage.setItem(LOCAL_BUNKER_URI, JSON.stringify({ bunkerUri }));
};

export const setKeysInLocalStorage = (pubkey: string, secret?: string) => {
  localStorage.setItem(LOCAL_STORAGE_KEYS, JSON.stringify({ pubkey, secret }));
};

export const removeKeysFromLocalStorage = () => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS);
};

export const removeBunkerUriFromLocalStorage = () => {
  localStorage.removeItem(LOCAL_BUNKER_URI);
};

export const removeAppSecretFromLocalStorage = () => {
  localStorage.removeItem(LOCAL_APP_SECRET_KEY);
};

export const getNcryptsecFromLocalStorage = (): string | null =>
  localStorage.getItem(LOCAL_NCRYPTSEC);

export const setNcryptsecInLocalStorage = (ncryptsec: string) =>
  localStorage.setItem(LOCAL_NCRYPTSEC, ncryptsec);

export const removeNcryptsecFromLocalStorage = () =>
  localStorage.removeItem(LOCAL_NCRYPTSEC);
