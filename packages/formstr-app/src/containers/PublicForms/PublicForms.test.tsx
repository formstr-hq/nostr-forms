import { render } from "@testing-library/react";
import PublicForms from "./index";
import { getPublicForms } from "../../nostr/publicForms";

jest.mock("../../nostr/publicForms", () => ({
  getPublicForms: jest.fn(),
}));
jest.mock("../../nostr/common", () => ({
  getDefaultRelays: () => ["wss://relay.mock"],
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("./PublicFormCard", () => ({
  __esModule: true,
  default: () => null,
}));

describe("PublicForms", () => {
  it("closes the relay subscription on unmount", () => {
    const close = jest.fn();
    (getPublicForms as jest.Mock).mockReturnValue({ close });

    const { unmount } = render(<PublicForms />);
    expect(getPublicForms).toHaveBeenCalledWith(
      ["wss://relay.mock"],
      expect.any(Function),
    );

    unmount();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
