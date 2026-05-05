// We need to mock SimplePool before importing fetchFormTemplate
const mockGet = jest.fn();
jest.mock("nostr-tools", () => {
  const actual = jest.requireActual("nostr-tools");
  return {
    ...actual,
    SimplePool: jest.fn().mockImplementation(() => ({
      get: mockGet,
    })),
  };
});

import { fetchFormTemplate, getDefaultRelays } from "../utils/fetchFormTemplate";
import { nip19 } from "nostr-tools";
import type { AddressPointer } from "nostr-tools/lib/types/nip19";

describe("getDefaultRelays", () => {
  it("returns an array of relay URLs", () => {
    const relays = getDefaultRelays();
    expect(Array.isArray(relays)).toBe(true);
    expect(relays.length).toBeGreaterThan(0);
  });

  it("all relay URLs start with wss://", () => {
    const relays = getDefaultRelays();
    relays.forEach((url) => {
      expect(url).toMatch(/^wss:\/\//);
    });
  });

  it("returns the same array on repeated calls (stable reference)", () => {
    const a = getDefaultRelays();
    const b = getDefaultRelays();
    expect(a).toEqual(b);
  });
});

describe("fetchFormTemplate", () => {
  // Build a valid naddr for testing
  const testPubkey = "a".repeat(64);
  const testIdentifier = "test-form-id";
  const testRelays = ["wss://relay.damus.io/"];

  const testNaddr = nip19.naddrEncode({
    pubkey: testPubkey,
    kind: 30168,
    identifier: testIdentifier,
    relays: testRelays,
  });

  const noRelayNaddr = nip19.naddrEncode({
    pubkey: testPubkey,
    kind: 30168,
    identifier: testIdentifier,
    relays: [],
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns tags from a public (unencrypted) form event", async () => {
    const mockEvent = {
      kind: 30168,
      pubkey: testPubkey,
      content: "",
      tags: [
        ["d", testIdentifier],
        ["name", "Test Form"],
        ["field", "q1", "text", "Your Name", "", "{}"],
        ["relay", "wss://relay.damus.io/"],
      ],
      created_at: 1000,
      id: "event-id",
      sig: "event-sig",
    };

    mockGet.mockResolvedValueOnce(mockEvent);
    const result = await fetchFormTemplate(testNaddr);

    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    // Public form: should contain all original tags plus the pubkey tag
    expect(result).toContainEqual(["d", testIdentifier]);
    expect(result).toContainEqual(["name", "Test Form"]);
    expect(result).toContainEqual(["pubkey", testPubkey]);
  });

  it("appends pubkey tag to returned tags for public forms", async () => {
    const mockEvent = {
      kind: 30168,
      pubkey: testPubkey,
      content: "",
      tags: [
        ["d", testIdentifier],
        ["name", "Form"],
      ],
      created_at: 1000,
      id: "event-id",
      sig: "event-sig",
    };

    mockGet.mockResolvedValueOnce(mockEvent);
    const result = await fetchFormTemplate(testNaddr);

    const pubkeyTag = result!.find(
      (t) => t[0] === "pubkey" && t[1] === testPubkey
    );
    expect(pubkeyTag).toBeDefined();
  });

  it("throws when event is not found on relays", async () => {
    mockGet.mockResolvedValueOnce(null);

    await expect(fetchFormTemplate(testNaddr)).rejects.toThrow(
      /Event not found on given relays/
    );
  });

  it("throws when encrypted form has no nkeys provided", async () => {
    const mockEvent = {
      kind: 30168,
      pubkey: testPubkey,
      content: "encrypted-content-here",
      tags: [
        ["d", testIdentifier],
        ["name", "Private Form"],
      ],
      created_at: 1000,
      id: "event-id",
      sig: "event-sig",
    };

    mockGet.mockResolvedValueOnce(mockEvent);

    // No nkeys provided
    await expect(fetchFormTemplate(testNaddr)).rejects.toThrow(
      /Could not decrypt form/
    );
  });

  it("queries the pool with correct filter", async () => {
    const mockEvent = {
      kind: 30168,
      pubkey: testPubkey,
      content: "",
      tags: [["d", testIdentifier]],
      created_at: 1000,
      id: "event-id",
      sig: "event-sig",
    };

    mockGet.mockResolvedValueOnce(mockEvent);
    await fetchFormTemplate(testNaddr);

    expect(mockGet).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        kinds: [30168],
        authors: [testPubkey],
        "#d": [testIdentifier],
      })
    );
  });

  it("uses relays from naddr when available", async () => {
    const mockEvent = {
      kind: 30168,
      pubkey: testPubkey,
      content: "",
      tags: [["d", testIdentifier]],
      created_at: 1000,
      id: "event-id",
      sig: "event-sig",
    };

    mockGet.mockResolvedValueOnce(mockEvent);
    await fetchFormTemplate(testNaddr);

    const usedRelays = mockGet.mock.calls[0][0];
    expect(usedRelays).toContain("wss://relay.damus.io/");
  });

  it("falls back to default relays when naddr has no relays", async () => {
    const mockEvent = {
      kind: 30168,
      pubkey: testPubkey,
      content: "",
      tags: [["d", testIdentifier]],
      created_at: 1000,
      id: "event-id",
      sig: "event-sig",
    };

    mockGet.mockResolvedValueOnce(mockEvent);
    await fetchFormTemplate(noRelayNaddr);

    const usedRelays = mockGet.mock.calls[0][0];
    expect(usedRelays).toEqual(getDefaultRelays());
  });

  it("preserves relay tags from the event for public forms", async () => {
    const mockEvent = {
      kind: 30168,
      pubkey: testPubkey,
      content: "",
      tags: [
        ["d", testIdentifier],
        ["relay", "wss://relay.damus.io/"],
        ["relay", "wss://nos.lol"],
      ],
      created_at: 1000,
      id: "event-id",
      sig: "event-sig",
    };

    mockGet.mockResolvedValueOnce(mockEvent);
    const result = await fetchFormTemplate(testNaddr);

    const relayTags = result!.filter((t) => t[0] === "relay");
    expect(relayTags).toHaveLength(2);
  });
});
