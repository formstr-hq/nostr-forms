import { hexToBytes } from "@noble/hashes/utils";
import { getPublicKey, nip19 } from "nostr-tools";
import { encodeNKeys } from "./nkeys";

const DEFAULT_FORM_RELAYS = ["wss://relay.damus.io"];

export type DraftLinkPayload = {
  formSpec: unknown;
  tempId: string;
};

const getRelayList = (relaysEncode?: string[]) => {
  return relaysEncode && relaysEncode.length !== 0
    ? relaysEncode
    : DEFAULT_FORM_RELAYS;
};

const appendQueryParams = (
  basePath: string,
  params: Record<string, string | null | undefined>,
) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
};

const appendHash = (basePath: string, hash?: string) => {
  return hash ? `${basePath}#${hash}` : basePath;
};

const withOrigin = (path: string, host = window.location.origin) => {
  return `${host}${path}`;
};

const getDraftPath = (draft: DraftLinkPayload) => {
  let draftHash = window.btoa(encodeURIComponent(JSON.stringify(draft)));
  draftHash = window.encodeURIComponent(draftHash);
  return `/drafts/${draftHash}`;
};

export const makeFormNAddr = (
  publicKey: string,
  formId: string,
  relaysEncode?: string[],
) => {
  return nip19.naddrEncode({
    pubkey: publicKey,
    identifier: formId,
    relays: getRelayList(relaysEncode),
    kind: 30168,
  });
};

/**
 * `disablePreview` preserves the newer link contract where secrets live in the
 * hash fragment instead of query params or server-visible routes.
 */
export const naddrUrl = (
  publicKey: string,
  formId: string,
  relaysEncode?: string[],
  viewKey?: string | null,
  disablePreview = false,
) => {
  const basePath = `/f/${makeFormNAddr(publicKey, formId, relaysEncode)}`;

  if (!disablePreview) {
    return appendQueryParams(basePath, { viewKey });
  }

  return appendHash(basePath, viewKey ? encodeNKeys({ viewKey }) : undefined);
};

export const constructFormUrl = (
  pubkey: string,
  formId: string,
  relays: string[],
  viewKey?: string | null,
  disablePreview = false,
  host = window.location.origin,
) => {
  return withOrigin(
    naddrUrl(pubkey, formId, relays, viewKey, disablePreview),
    host,
  );
};

export const editPath = (
  formSecret: string,
  naddr: string,
  viewKey?: string | null,
  disablePreview = true,
) => {
  const basePath = `/edit/${naddr}`;

  if (!disablePreview) {
    return appendHash(appendQueryParams(basePath, { viewKey }), formSecret);
  }

  return appendHash(
    basePath,
    encodeNKeys({
      ...(viewKey ? { viewKey } : {}),
      secretKey: formSecret,
    }),
  );
};

export const responsePath = (
  secretKey: string,
  naddr: string,
  viewKey?: string | null,
  disablePreview = false,
) => {
  const basePath = `/s/${naddr}`;

  if (!disablePreview) {
    return appendHash(appendQueryParams(basePath, { viewKey }), secretKey);
  }

  return appendHash(
    basePath,
    encodeNKeys({
      ...(viewKey ? { viewKey } : {}),
      secretKey,
    }),
  );
};

export const constructNewResponseUrl = (
  secretKey: string,
  formId: string,
  relays?: string[],
  viewKey?: string,
  disablePreview = false,
  host = window.location.origin,
) => {
  const naddr = makeFormNAddr(
    getPublicKey(hexToBytes(secretKey)),
    formId,
    relays,
  );
  return withOrigin(
    responsePath(secretKey, naddr, viewKey, disablePreview),
    host,
  );
};

export function constructDraftUrl(
  draft: DraftLinkPayload | null,
  host = window.location.origin,
) {
  if (!draft) {
    return;
  }
  return withOrigin(getDraftPath(draft), host);
}
