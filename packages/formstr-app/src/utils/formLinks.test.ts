import {
  constructDraftUrl,
  constructFormUrl,
  editPath,
  makeFormNAddr,
  responsePath,
} from "./formLinks";
import { encodeNKeys } from "./nkeys";

describe("formLinks", () => {
  test("constructDraftUrl builds a draft link from the provided host", () => {
    const draft = {
      formSpec: [["name", "Draft form"]],
      tempId: "abc123",
    };

    expect(constructDraftUrl(draft, "https://formstr.app")).toMatch(
      /^https:\/\/formstr\.app\/drafts\//,
    );
  });

  test("constructFormUrl preserves preview query param behavior", () => {
    const url = constructFormUrl(
      "f".repeat(64),
      "form123",
      ["wss://relay.example.com"],
      "view-secret",
      false,
      "https://formstr.app",
    );

    expect(url).toContain("/f/");
    expect(url).toContain("?viewKey=view-secret");
  });

  test("editPath encodes secrets in the hash when preview is disabled", () => {
    const naddr = makeFormNAddr("f".repeat(64), "form123", [
      "wss://relay.example.com",
    ]);

    expect(editPath("secret-key", naddr, "view-secret", true)).toBe(
      `/edit/${naddr}#${encodeNKeys({
        viewKey: "view-secret",
        secretKey: "secret-key",
      })}`,
    );
  });

  test("responsePath keeps the legacy preview-compatible format when enabled", () => {
    const naddr = makeFormNAddr("f".repeat(64), "form123", [
      "wss://relay.example.com",
    ]);

    expect(responsePath("secret-key", naddr, "view-secret", false)).toBe(
      `/s/${naddr}?viewKey=view-secret#secret-key`,
    );
  });
});
