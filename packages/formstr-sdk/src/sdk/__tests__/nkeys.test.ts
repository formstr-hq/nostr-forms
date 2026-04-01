import { encodeNKeys, decodeNKeys } from "../utils/nkeys";

describe("NKeys encoding/decoding", () => {
  describe("encodeNKeys", () => {
    it("returns a string starting with 'nkeys1'", () => {
      const encoded = encodeNKeys({ viewKey: "abc123" });
      expect(encoded).toMatch(/^nkeys1/);
    });

    it("encodes a single key-value pair", () => {
      const encoded = encodeNKeys({ viewKey: "deadbeef" });
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(6); // "nkeys1" + data
    });

    it("encodes multiple key-value pairs", () => {
      const encoded = encodeNKeys({
        viewKey: "deadbeef",
        editKey: "cafebabe",
      });
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(6);
    });
  });

  describe("decodeNKeys", () => {
    it("round-trips a single key-value pair", () => {
      const original = { viewKey: "deadbeef" };
      const encoded = encodeNKeys(original);
      const decoded = decodeNKeys(encoded);
      expect(decoded).toEqual(original);
    });

    it("round-trips multiple key-value pairs", () => {
      const original = {
        viewKey: "deadbeef",
        editKey: "cafebabe",
      };
      const encoded = encodeNKeys(original);
      const decoded = decodeNKeys(encoded);
      expect(decoded).toEqual(original);
    });

    it("round-trips a secretKey + viewKey combination", () => {
      const original = {
        viewKey: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
        secretKey: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      };
      const encoded = encodeNKeys(original);
      const decoded = decodeNKeys(encoded);
      expect(decoded).toEqual(original);
    });

    it("round-trips keys with empty string values", () => {
      const original = { viewKey: "" };
      const encoded = encodeNKeys(original);
      const decoded = decodeNKeys(encoded);
      expect(decoded).toEqual(original);
    });

    it("round-trips keys with special characters", () => {
      const original = { myKey: "hello-world_123/test" };
      const encoded = encodeNKeys(original);
      const decoded = decodeNKeys(encoded);
      expect(decoded).toEqual(original);
    });

    it("round-trips keys with unicode text", () => {
      const original = { label: "日本語テスト" };
      const encoded = encodeNKeys(original);
      const decoded = decodeNKeys(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe("determinism", () => {
    it("produces the same output for the same input", () => {
      const input = { viewKey: "deadbeef", secretKey: "cafebabe" };
      const first = encodeNKeys(input);
      const second = encodeNKeys(input);
      expect(first).toBe(second);
    });
  });

  describe("error handling", () => {
    it("throws on invalid bech32 string", () => {
      expect(() => decodeNKeys("invalid-string")).toThrow();
    });

    it("throws on wrong bech32 prefix", () => {
      // npub is valid bech32 but wrong prefix — bech32 decode will still work,
      // but the TLV data will be garbage. decodeNKeys should not crash but
      // may return incorrect/empty data. It should at minimum not throw.
      // This tests robustness of the TLV parser.
      expect(() => {
        try {
          decodeNKeys("nkeys1invaliddata");
        } catch {
          throw new Error("decode failed");
        }
      }).toThrow();
    });
  });
});
