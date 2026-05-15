import { IFormSettings } from "../../components/FormSettings/types";
import { mergeLoadedFormSettings } from "./settingsUtils";

describe("mergeLoadedFormSettings", () => {
  const initialFormSettings: IFormSettings = {
    notificationEncryption: "nip44",
    thankYouPage: true,
  };

  it("preserves legacy forms without the opt-in flag", () => {
    const merged = mergeLoadedFormSettings(initialFormSettings, {
      notifyNpubs: ["npub1legacyuser"],
    });

    expect(merged.notificationEncryption).toBeUndefined();
    expect(merged.notifyNpubs).toEqual(["npub1legacyuser"]);
  });

  it("keeps explicit notification encryption for opted-in forms", () => {
    const merged = mergeLoadedFormSettings(initialFormSettings, {
      notificationEncryption: "nip44",
      notifyNpubs: ["npub1newuser"],
    });

    expect(merged.notificationEncryption).toBe("nip44");
    expect(merged.notifyNpubs).toEqual(["npub1newuser"]);
  });
});