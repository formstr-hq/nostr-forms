import { getPublicForms } from "./publicForms";
import { subscribe } from "../dataLayer";

jest.mock("../dataLayer", () => ({
  subscribe: jest.fn(),
}));

describe("getPublicForms", () => {
  it("returns the subscription handle so callers can close it", () => {
    const close = jest.fn();
    (subscribe as jest.Mock).mockReturnValue({ close });
    const callback = jest.fn();

    const subscription = getPublicForms(["wss://relay.example"], callback);

    expect(subscribe).toHaveBeenCalledWith(
      [{ kinds: [30168], limit: 50, "#t": ["public"] }],
      callback,
      ["wss://relay.example"],
    );
    subscription.close();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
