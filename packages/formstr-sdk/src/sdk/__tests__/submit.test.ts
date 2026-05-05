import { FormstrSDK, createEphemeralSigner } from "../FormstrSDK";
import type { NormalizedForm, NormalizedField } from "../types";

// Mock the pool module to prevent actual relay connections
jest.mock("../pool", () => ({
  pool: {
    publish: jest.fn().mockReturnValue([Promise.resolve("ok")]),
  },
}));

import { pool } from "../pool";

const sdk = new FormstrSDK();

function makeForm(overrides: Partial<NormalizedForm> = {}): NormalizedForm {
  return {
    id: "test-form",
    name: "Test Form",
    pubkey: "abc123pubkey",
    fields: {
      q1: {
        id: "q1",
        type: "text",
        labelHtml: "Your Name",
        config: { required: true },
      },
      q2: {
        id: "q2",
        type: "option",
        labelHtml: "Pick one",
        options: [
          { id: "opt1", labelHtml: "Yes" },
          { id: "opt2", labelHtml: "No" },
        ],
        config: {},
      },
    },
    fieldOrder: ["q1", "q2"],
    relays: ["wss://relay.damus.io/", "wss://nos.lol"],
    settings: {},
    ...overrides,
  };
}

describe("createEphemeralSigner", () => {
  it("returns a function", () => {
    const signer = createEphemeralSigner();
    expect(typeof signer).toBe("function");
  });

  it("signs an event template and returns a valid event", async () => {
    const signer = createEphemeralSigner();
    const event = await signer({
      kind: 1069,
      content: "",
      tags: [["a", "30168:pub:id"]],
      created_at: Math.floor(Date.now() / 1000),
    });

    expect(event).toBeDefined();
    expect(event.kind).toBe(1069);
    expect(event.id).toBeDefined();
    expect(event.sig).toBeDefined();
    expect(event.pubkey).toBeDefined();
    expect(typeof event.id).toBe("string");
    expect(event.id.length).toBe(64); // hex SHA-256
    expect(typeof event.sig).toBe("string");
  });

  it("produces different keys on each call", async () => {
    const signer1 = createEphemeralSigner();
    const signer2 = createEphemeralSigner();

    const event1 = await signer1({
      kind: 1,
      content: "",
      tags: [],
      created_at: 1000,
    });
    const event2 = await signer2({
      kind: 1,
      content: "",
      tags: [],
      created_at: 1000,
    });

    expect(event1.pubkey).not.toBe(event2.pubkey);
  });
});

describe("FormstrSDK.submit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a kind 1069 event with correct 'a' tag", async () => {
    const form = makeForm();
    const mockSigner = jest.fn().mockImplementation(async (event: any) => ({
      ...event,
      id: "mock-id",
      sig: "mock-sig",
      pubkey: "mock-pubkey",
    }));

    const result = await sdk.submit(form, { q1: "John" }, mockSigner);

    // Check the signer was called with the right event shape
    const signedEvent = mockSigner.mock.calls[0][0];
    expect(signedEvent.kind).toBe(1069);
    expect(signedEvent.content).toBe("");
    expect(signedEvent.tags[0]).toEqual([
      "a",
      "30168:abc123pubkey:test-form",
    ]);
  });

  it("creates response tags for each submitted value", async () => {
    const form = makeForm();
    const mockSigner = jest.fn().mockImplementation(async (event: any) => ({
      ...event,
      id: "mock-id",
      sig: "mock-sig",
      pubkey: "mock-pubkey",
    }));

    await sdk.submit(form, { q1: "Alice", q2: "opt1" }, mockSigner);

    const signedEvent = mockSigner.mock.calls[0][0];
    // tags[0] is the "a" tag, then response tags
    expect(signedEvent.tags).toContainEqual([
      "response",
      "q1",
      "Alice",
      "{}",
    ]);
    expect(signedEvent.tags).toContainEqual([
      "response",
      "q2",
      "opt1",
      "{}",
    ]);
  });

  it("joins array values with semicolon for multi-select", async () => {
    const form = makeForm({
      fields: {
        q1: {
          id: "q1",
          type: "option",
          labelHtml: "Choose many",
          config: {},
        },
      },
      fieldOrder: ["q1"],
    });
    const mockSigner = jest.fn().mockImplementation(async (event: any) => ({
      ...event,
      id: "mock-id",
      sig: "mock-sig",
      pubkey: "mock-pubkey",
    }));

    await sdk.submit(form, { q1: ["opt1", "opt2", "opt3"] }, mockSigner);

    const signedEvent = mockSigner.mock.calls[0][0];
    expect(signedEvent.tags).toContainEqual([
      "response",
      "q1",
      "opt1;opt2;opt3",
      "{}",
    ]);
  });

  it("serializes grid values as JSON string", async () => {
    const form = makeForm({
      fields: {
        g1: {
          id: "g1",
          type: "grid",
          labelHtml: "Grid question",
          config: {},
        },
      },
      fieldOrder: ["g1"],
    });
    const mockSigner = jest.fn().mockImplementation(async (event: any) => ({
      ...event,
      id: "mock-id",
      sig: "mock-sig",
      pubkey: "mock-pubkey",
    }));

    const gridValue = { row1: "col1", row2: "col2" };
    await sdk.submit(form, { g1: gridValue }, mockSigner);

    const signedEvent = mockSigner.mock.calls[0][0];
    expect(signedEvent.tags).toContainEqual([
      "response",
      "g1",
      JSON.stringify(gridValue),
      "{}",
    ]);
  });

  it("passes through grid values that are already strings", async () => {
    const form = makeForm({
      fields: {
        g1: {
          id: "g1",
          type: "grid",
          labelHtml: "Grid question",
          config: {},
        },
      },
      fieldOrder: ["g1"],
    });
    const mockSigner = jest.fn().mockImplementation(async (event: any) => ({
      ...event,
      id: "mock-id",
      sig: "mock-sig",
      pubkey: "mock-pubkey",
    }));

    const gridStr = '{"row1":"col1"}';
    await sdk.submit(form, { g1: gridStr }, mockSigner);

    const signedEvent = mockSigner.mock.calls[0][0];
    expect(signedEvent.tags).toContainEqual([
      "response",
      "g1",
      gridStr,
      "{}",
    ]);
  });

  it("publishes the signed event to the form's relays", async () => {
    const form = makeForm();
    const mockSigner = jest.fn().mockImplementation(async (event: any) => ({
      ...event,
      id: "mock-id",
      sig: "mock-sig",
      pubkey: "mock-pubkey",
    }));

    await sdk.submit(form, { q1: "test" }, mockSigner);

    expect(pool.publish).toHaveBeenCalledWith(
      ["wss://relay.damus.io/", "wss://nos.lol"],
      expect.objectContaining({ id: "mock-id" })
    );
  });

  it("uses ephemeral signer when no signer is provided", async () => {
    const form = makeForm();
    const result = await sdk.submit(form, { q1: "test" });

    // Should still succeed — the ephemeral signer creates a real event
    expect(result).toBeDefined();
    expect(result.kind).toBe(1069);
    expect(result.id).toBeDefined();
    expect(result.sig).toBeDefined();
    expect(result.pubkey).toBeDefined();
    expect(pool.publish).toHaveBeenCalled();
  });

  it("returns the signed event", async () => {
    const form = makeForm();
    const mockSigner = jest.fn().mockImplementation(async (event: any) => ({
      ...event,
      id: "signed-event-id",
      sig: "signed-sig",
      pubkey: "signed-pubkey",
    }));

    const result = await sdk.submit(form, { q1: "test" }, mockSigner);
    expect(result.id).toBe("signed-event-id");
  });
});
