export const DEFAULT_RELAYS: string[] = [
  "wss://relay.formstr.app",
  "wss://relay.damus.io/",
  "wss://relay.primal.net/",
  "wss://nos.lol",
  "wss://relay.nostr.wirednet.jp/",
  "wss://nostr-01.yakihonne.com",
  "wss://relay.snort.social",
  "wss://relay.nostr.band",
  "wss://nostr21.com",
];

export const DEFAULT_RELAY = "wss://relay.damus.io";

export const PUBLIC_READ_RELAYS: string[] = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
];

export const getDefaultRelays = (): string[] => {
  // Allow overriding the relay set at build time (e.g. point e2e tests at a
  // local relay). Unset in production, so the hardcoded list is used.
  const override = process.env.REACT_APP_DEFAULT_RELAYS;
  if (override) {
    const relays = override
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);
    if (relays.length) return relays;
  }
  return DEFAULT_RELAYS;
};
