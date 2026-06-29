/**
 * Minimal in-memory nostr relay (NIP-01) for e2e tests.
 *
 * Stores events in memory and serves REQ subscriptions — enough for the app to
 * publish a form + response and read them back. It does NOT verify signatures
 * (the app sends real signed events, and the client verifies on its end), and it
 * is wiped on restart. Run standalone: `node tests/e2e/relay-server.cjs`.
 */
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.RELAY_PORT || 7448);

const isReplaceable = (kind) =>
  kind === 0 || kind === 3 || (kind >= 10000 && kind < 20000);
const isParamReplaceable = (kind) => kind >= 30000 && kind < 40000;
const dTag = (event) => event.tags.find((t) => t[0] === "d")?.[1] ?? "";

function matchFilter(filter, event) {
  if (filter.ids && !filter.ids.includes(event.id)) return false;
  if (filter.authors && !filter.authors.includes(event.pubkey)) return false;
  if (filter.kinds && !filter.kinds.includes(event.kind)) return false;
  if (typeof filter.since === "number" && event.created_at < filter.since)
    return false;
  if (typeof filter.until === "number" && event.created_at > filter.until)
    return false;
  for (const key of Object.keys(filter)) {
    if (key[0] === "#" && key.length === 2) {
      const name = key[1];
      const wanted = filter[key];
      const ok = event.tags.some(
        (t) => t[0] === name && wanted.includes(t[1]),
      );
      if (!ok) return false;
    }
  }
  return true;
}

const events = [];
const subs = new Map(); // ws -> Map(subId -> filters[])

function store(event) {
  if (isParamReplaceable(event.kind)) {
    const d = dTag(event);
    const i = events.findIndex(
      (e) => e.kind === event.kind && e.pubkey === event.pubkey && dTag(e) === d,
    );
    if (i >= 0) {
      if (events[i].created_at >= event.created_at) return false;
      events.splice(i, 1);
    }
  } else if (isReplaceable(event.kind)) {
    const i = events.findIndex(
      (e) => e.kind === event.kind && e.pubkey === event.pubkey,
    );
    if (i >= 0) {
      if (events[i].created_at >= event.created_at) return false;
      events.splice(i, 1);
    }
  } else if (events.some((e) => e.id === event.id)) {
    return false;
  }
  events.push(event);
  return true;
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  subs.set(ws, new Map());
  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    const [type, ...rest] = msg;

    if (type === "EVENT") {
      const event = rest[0];
      store(event);
      ws.send(JSON.stringify(["OK", event.id, true, ""]));
      for (const [client, clientSubs] of subs) {
        if (client.readyState !== 1) continue;
        for (const [subId, filters] of clientSubs) {
          if (filters.some((f) => matchFilter(f, event))) {
            client.send(JSON.stringify(["EVENT", subId, event]));
          }
        }
      }
    } else if (type === "REQ") {
      const subId = rest[0];
      const filters = rest.slice(1);
      subs.get(ws).set(subId, filters);
      const matched = events
        .filter((e) => filters.some((f) => matchFilter(f, e)))
        .sort((a, b) => a.created_at - b.created_at);
      for (const e of matched) ws.send(JSON.stringify(["EVENT", subId, e]));
      ws.send(JSON.stringify(["EOSE", subId]));
    } else if (type === "CLOSE") {
      const subId = rest[0];
      subs.get(ws)?.delete(subId);
      ws.send(JSON.stringify(["CLOSED", subId, ""]));
    }
  });
  ws.on("close", () => subs.delete(ws));
});

wss.on("listening", () =>
  console.log(`[e2e-relay] listening on ws://localhost:${PORT}`),
);
