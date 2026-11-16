import { MODULE_DEFAULT_RELAYS } from "@formstr/core/relay";
import { DEFAULT_RELAYS, getDefaultRelays } from "./constants";

describe("relay constants", () => {
  it("returns the default relay list", () => {
    expect(getDefaultRelays()).toBe(DEFAULT_RELAYS);
  });

  it("uses the shared forms relay defaults", () => {
    expect(DEFAULT_RELAYS).toEqual(MODULE_DEFAULT_RELAYS.forms);
  });

  it("contains only wss URLs", () => {
    DEFAULT_RELAYS.forEach((relay) => expect(relay).toMatch(/^wss:\/\//));
  });
});
