import {
  DEFAULT_RELAYS,
  DEFAULT_RELAY,
  PUBLIC_READ_RELAYS,
  getDefaultRelays,
} from "./relays";

describe("relay constants", () => {
  const original = process.env.REACT_APP_DEFAULT_RELAYS;

  afterEach(() => {
    if (original === undefined) delete process.env.REACT_APP_DEFAULT_RELAYS;
    else process.env.REACT_APP_DEFAULT_RELAYS = original;
  });

  it("returns the default list when no override is set", () => {
    delete process.env.REACT_APP_DEFAULT_RELAYS;
    expect(getDefaultRelays()).toEqual(DEFAULT_RELAYS);
  });

  it("parses a comma-separated override", () => {
    process.env.REACT_APP_DEFAULT_RELAYS =
      " wss://a.example , wss://b.example ";
    expect(getDefaultRelays()).toEqual(["wss://a.example", "wss://b.example"]);
  });

  it("ignores an empty override", () => {
    process.env.REACT_APP_DEFAULT_RELAYS = " , ";
    expect(getDefaultRelays()).toEqual(DEFAULT_RELAYS);
  });

  it("keeps relay constants valid wss URLs", () => {
    [DEFAULT_RELAY, ...PUBLIC_READ_RELAYS].forEach((relay) =>
      expect(relay).toMatch(/^wss:\/\//),
    );
  });
});
