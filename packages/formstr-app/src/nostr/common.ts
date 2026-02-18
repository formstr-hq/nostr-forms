import {
  Event,
  EventTemplate,
  Filter,
  VerifiedEvent,
  finalizeEvent,
  generateSecretKey,
  getEventHash,
  getPublicKey,
  nip04,
  nip19,
  nip44,
  Relay,
  UnsignedEvent,
} from "nostr-tools";
import { normalizeURL } from "nostr-tools/utils";
import { Field, Response, Tag } from "./types";
import { IFormSettings } from "../containers/CreateFormNew/components/FormSettings/types";
import { signerManager } from "../signer";
import { AbstractRelay } from "nostr-tools/abstract-relay";
import { pool } from "../pool";

declare global {
  interface Window {
    __FORMSTR__FORM_IDENTIFIER__: {
      naddr?: string;
      viewKey?: string;
      formContent?: string;
    };
    nostr: any;
  }
}

const defaultRelays = [
  "wss://relay.damus.io/",
  "wss://relay.primal.net/",
  "wss://nos.lol",
  "wss://relay.nostr.wirednet.jp/",
  "wss://nostr-01.yakihonne.com",
  "wss://relay.snort.social",
  "wss://relay.nostr.band",
  "wss://nostr21.com",
];

export const getDefaultRelays = () => {
  return defaultRelays;
};

function toHexNpub(npubOrHex: string): string {
  try {
    // Attempt to decode npub
    const decoded = nip19.decode(npubOrHex);
    if (decoded.type !== "npub" || typeof decoded.data !== "string") {
      throw new Error("Invalid npub format");
    }
    return decoded.data;
  } catch {
    // Not a valid npub, check if it's a valid hex pubkey
    if (/^[0-9a-f]{64}$/i.test(npubOrHex)) {
      return npubOrHex;
    }
    throw new Error(`Invalid public key format: ${npubOrHex}`);
  }
}

export async function getUserPublicKey(userSecretKey: Uint8Array | null) {
  let userPublicKey;
  if (userSecretKey) {
    userPublicKey = getPublicKey(userSecretKey);
  } else {
    const signer = await signerManager.getSigner();
    userPublicKey = await signer.getPublicKey();
  }
  return userPublicKey;
}

export async function signEvent(
  baseEvent: EventTemplate,
  userSecretKey: Uint8Array | null,
) {
  let nostrEvent;
  if (userSecretKey) {
    nostrEvent = finalizeEvent(baseEvent, userSecretKey);
  } else {
    const singer = await signerManager.getSigner();
    nostrEvent = await singer.signEvent(baseEvent);
  }
  return nostrEvent;
}

export const customPublish = (
  relays: string[],
  event: Event,
  onAcceptedRelays?: (relay: string) => void,
): Promise<string>[] => {
  return relays.map(normalizeURL).map(async (url, i, arr) => {
    if (arr.indexOf(url) !== i) {
      return Promise.reject("duplicate url");
    }

    let relay: AbstractRelay | null = null;
    try {
      relay = await ensureRelay(url, { connectionTimeout: 5000 });

      const tryPublish = () =>
        Promise.race<string>([
          relay!.publish(event),
          new Promise<string>((_, reject) =>
            setTimeout(() => reject("timeout"), 5000),
          ),
        ]);

      try {
        const reason = await tryPublish();
        onAcceptedRelays?.(url);
        return reason;
      } catch (err: any) {
        const msg: string = err?.message ?? String(err);
        const isAuthError =
          msg.startsWith("auth-required:") || msg.includes("unauthorized");
        if (!isAuthError) throw err;

        // Relay rejected — wait briefly for the AUTH challenge frame to arrive.
        await new Promise((r) => setTimeout(r, 200));
        const signer = await signerManager.getSigner();
        await relay.auth((ev) => signer.signEvent(ev) as Promise<VerifiedEvent>);

        const reason = await tryPublish();
        onAcceptedRelays?.(url);
        return reason;
      }
    } finally {
      if (relay) {
        try {
          await relay.close();
        } catch {
          // Ignore closing errors
        }
      }
    }
  });
};

function createQuestionMap(form: Tag[]) {
  const questionMap: { [key: string]: Field } = {};
  form.forEach((field) => {
    if (field[0] !== "field") return;
    questionMap[field[1]] = field as Field;
  });
  return questionMap;
}

const getDisplayAnswer = (answer: string | number | boolean, field: Field) => {
  const choices = JSON.parse(field[4]);
  return (
    choices
      ?.filter((choice: Tag) => {
        const answers = answer.toString().split(";");
        return answers.includes(choice[0]);
      })
      .map((choice: Tag) => choice[1])
      .join(", ") || (answer || "").toString()
  );
};

export const sendNotification = async (
  form: Tag[],
  response: Array<Response>,
) => {
  const name = form.filter((f) => f[0] === "name")?.[0][1];
  const settings = JSON.parse(
    form.filter((f) => f[0] === "settings")?.[0][1],
  ) as IFormSettings;
  let message = 'New response for form: "' + name + '"';
  const questionMap = createQuestionMap(form);
  message += "\n" + "Answers: \n";
  response.forEach((response) => {
    if (response[0] !== "response") return;
    const question = questionMap[response[1]];
    message +=
      "\n" +
      question[3] +
      ": \n" +
      getDisplayAnswer(response[2], question) +
      "\n";
  });
  message += "Visit https://formstr.app to view the responses.";
  const newSk = generateSecretKey();
  const newPk = getPublicKey(newSk);
  settings.notifyNpubs?.forEach(async (npub) => {
    const hexNpub = toHexNpub(npub);
    const encryptedMessage = await nip04.encrypt(newSk, hexNpub, message);
    const baseKind4Event: Event = {
      kind: 4,
      pubkey: newPk,
      tags: [["p", hexNpub]],
      content: encryptedMessage,
      created_at: Math.floor(Date.now() / 1000),
      id: "",
      sig: "",
    };
    const kind4Event = finalizeEvent(baseKind4Event, newSk);
    pool.publish(defaultRelays, kind4Event);
  });
};

export const sendNRPCWebhook = async (
  form: Tag[],
  responses: Response[],
  relays: string[],
  privateKey?: Uint8Array,
) => {
  const settingsTag = form.find((f) => f[0] === "settings");
  let settings: IFormSettings = {} as IFormSettings;
  try {
    settings = settingsTag ? JSON.parse(settingsTag[1]) : ({} as IFormSettings);
  } catch (err) {
    console.error("Invalid settings json", err);
    return;
  }

  const nrpcMethod = settings?.nrpcMethod;
  const nrpcPubkey = settings?.nrpcPubkey;
  if (!nrpcPubkey || !nrpcMethod) return; // no webhook configured

  // collect params
  const questionMap = createQuestionMap(form);
  const params: string[][] = [];
  for (const r of responses) {
    if (r[0] !== "response") continue;
    const question = questionMap[r[1]];
    if (!question) continue;
    params.push(["param", question[3], getDisplayAnswer(r[2], question)]);
  }

  // reuse the existing RPC flow
  try {
    const resp = await callRPC(
      relays,
      nrpcPubkey,
      nrpcMethod,
      params,
      privateKey,
    );
    return resp;
  } catch (err) {
    console.error("Webhook RPC call failed:", err);
    throw err;
  }
};

export const ensureRelay = async (
  url: string,
  params?: { connectionTimeout?: number },
): Promise<AbstractRelay> => {
  url = normalizeURL(url);
  const relay = new Relay(url);
  if (params?.connectionTimeout)
    relay.connectionTimeout = params.connectionTimeout;
  await relay.connect();
  return relay;
};

const encryptResponse = async (
  message: string,
  receiverPublicKey: string,
  senderPrivateKey: Uint8Array | null,
) => {
  if (!senderPrivateKey) {
    const signer = await signerManager.getSigner();
    return await signer.nip44Encrypt!(receiverPublicKey, message);
  }
  const conversationKey = nip44.v2.utils.getConversationKey(
    senderPrivateKey,
    receiverPublicKey,
  );
  return nip44.v2.encrypt(message, conversationKey);
};

export const sendResponses = async (
  formAuthorPub: string,
  formId: string,
  responses: Response[],
  responderSecretKey: Uint8Array | null = null,
  encryptResponses = true,
  relays: string[] = [],
  onAcceptedRelays?: (url: string) => void,
) => {
  if (!formId) {
    alert("FORM ID NOT FOUND");
    return;
  }
  let responderPub;
  responderPub = await getUserPublicKey(responderSecretKey);
  let tags = [["a", `30168:${formAuthorPub}:${formId}`]];
  let content = "";
  if (!encryptResponses) {
    tags = [...tags, ...responses];
  } else {
    content = await encryptResponse(
      JSON.stringify(responses),
      formAuthorPub,
      responderSecretKey,
    );
  }
  const baseEvent: UnsignedEvent = {
    kind: 1069,
    pubkey: responderPub,
    tags: tags,
    content: content,
    created_at: Math.floor(Date.now() / 1000),
  };
  const fullEvent = await signEvent(baseEvent, responderSecretKey);
  let relayList = relays;
  if (relayList.length === 0) {
    relayList = defaultRelays;
  }
  const messages = await Promise.allSettled(
    customPublish(relayList, fullEvent!, onAcceptedRelays),
  );
  console.log("Message from relays", messages);
};

//
// 1. Rumor construction
//
function buildRumor(
  serverPubkey: string,
  method: string,
  params: string[][] = [],
): any {
  return {
    kind: 68,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["p", serverPubkey], ["method", method], ...params],
    content: "",
  };
}

//
// 2. Sealing
//
async function sealRumor(
  rumor: any,
  serverPubkey: string,
  callerSk?: Uint8Array,
): Promise<Event> {
  let encryptedRumor;
  if (callerSk) {
    const convKey = nip44.getConversationKey(callerSk, serverPubkey);
    encryptedRumor = nip44.encrypt(JSON.stringify(rumor), convKey);
  } else {
    encryptedRumor = await (
      await signerManager.getSigner()
    ).nip44Encrypt!(serverPubkey, JSON.stringify(rumor));
  }
  return signEvent(
    {
      kind: 25,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["p", serverPubkey]],
      content: encryptedRumor,
    },
    callerSk || null,
  );
}

//
// 3. Giftwrapping
//
function giftwrapSeal(
  seal: Event,
  serverPubkey: string,
): { giftwrap: Event; ephSk: Uint8Array } {
  const ephSk = generateSecretKey();
  const wrapConvKey = nip44.getConversationKey(ephSk, serverPubkey);
  const encryptedSeal = nip44.encrypt(JSON.stringify(seal), wrapConvKey);

  return {
    giftwrap: finalizeEvent(
      {
        kind: 21169,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["p", serverPubkey]],
        content: encryptedSeal,
      },
      ephSk,
    ),
    ephSk,
  };
}

//
// 4. Publish
//
async function publishGiftwrap(relays: string[], giftwrap: any) {
  const messages = await Promise.allSettled(customPublish(relays, giftwrap));
  console.log("Webhook event: Relay messages", messages);
  return messages;
}

//
// 5. Unwrapping response
//
async function unwrapGiftwrap(
  resp: any,
  serverPubkey: string,
  callerSk?: Uint8Array,
): Promise<any> {
  let sealJson;
  if (callerSk) {
    const sealConvKey = nip44.getConversationKey(callerSk, resp.pubkey);
    sealJson = nip44.decrypt(resp.content, sealConvKey);
  } else {
    sealJson = await (
      await signerManager.getSigner()
    ).nip44Decrypt!(resp.pubkey, resp.content);
  }
  const sealObj = JSON.parse(sealJson);

  let rumorJson;
  if (callerSk) {
    const respConvKey = nip44.getConversationKey(callerSk, serverPubkey);
    rumorJson = nip44.decrypt(sealObj.content, respConvKey);
  } else {
    rumorJson = await (
      await signerManager.getSigner()
    ).nip44Decrypt!(serverPubkey, sealObj.content);
  }
  return JSON.parse(rumorJson);
}

//
// 6. Extract helpers
//
function extractResultsByType(rumorResp: any, type: string): string[][] {
  return rumorResp.tags.filter(
    (t: string[]) => t[0] === "result" && t[1] === type,
  );
}

function extractMethods(rumorResp: any): string[] {
  return extractResultsByType(rumorResp, "method").map((t: string[]) => t[2]);
}

async function callRPC(
  relays: string[],
  serverPubkey: string,
  method: string,
  params: string[][] = [],
  anonUser?: Uint8Array | null,
): Promise<UnsignedEvent> {
  // caller identity
  let callerPk;
  let callerSk: Uint8Array | undefined;
  if (anonUser) {
    callerSk = anonUser;
    callerPk = getPublicKey(callerSk);
  } else {
    callerPk = await (await signerManager.getSigner()).getPublicKey();
  }
  // build rumor
  const rumor = buildRumor(serverPubkey, method, params);
  rumor.pubkey = callerPk;
  rumor.id = getEventHash(rumor);

  // seal + giftwrap
  const seal = await sealRumor(rumor, serverPubkey, callerSk);
  const { giftwrap } = giftwrapSeal(seal, serverPubkey);

  // publish
  console.log("Publishing gift wraps");
  await publishGiftwrap(relays, giftwrap);
  console.log("Waiting for NRPC Response");
  // wait for response
  return new Promise((resolve, reject) => {
    const sub = pool.subscribeMany(
      relays,
      [{ kinds: [21169], "#e": [rumor.id] }],
      {
        async onevent(resp) {
          try {
            console.log("Got reply");
            const rumorResp = await unwrapGiftwrap(
              resp,
              serverPubkey,
              callerSk,
            );

            if (rumorResp.kind === 69) {
              resolve(rumorResp);
              sub.close();
            }
          } catch (err) {
            console.error("Failed to decrypt response:", err);
          }
        },
        oneose() {
          console.log("Relay reports EOSE");
        },
      },
    );
  });
}

export async function fetchNRPCMethods(relays: string[], serverPubkey: string) {
  console.log("Calling", relays, serverPubkey);
  const resp = await callRPC(
    relays,
    serverPubkey,
    "getMethods",
    [],
    generateSecretKey(),
  );
  return extractMethods(resp);
}
export async function fetchKind0Events(
  relayUrls: string[],
  tag: string,
  limit = 100,
  timeoutMs = 8000,
): Promise<Event[]> {
  const filter: Filter = {
    kinds: [0],
    "#t": [tag], // 🔹 Proper tag filter — let relays handle filtering
    limit,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const events = await pool.querySync(relayUrls, filter);
    clearTimeout(timeout);

    // ✅ Deduplicate by pubkey: keep only the newest event per pubkey
    const latestByPubkey = new Map<string, Event>();

    for (const ev of events) {
      const existing = latestByPubkey.get(ev.pubkey);
      if (!existing || ev.created_at > existing.created_at) {
        latestByPubkey.set(ev.pubkey, ev);
      }
    }

    // Return newest first
    return Array.from(latestByPubkey.values()).sort(
      (a, b) => b.created_at - a.created_at,
    );
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
