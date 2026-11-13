import { DEFAULT_RELAYS, getDefaultRelays } from "./constants";

describe("relay constants", () => {
  it("returns the default relay list", () => {
    expect(getDefaultRelays()).toBe(DEFAULT_RELAYS);
  });

  it("contains only wss URLs", () => {
    DEFAULT_RELAYS.forEach((relay) => expect(relay).toMatch(/^wss:\/\//));
  });
});
