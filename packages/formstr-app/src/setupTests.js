// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// jsdom does not provide these; nostr-tools needs them.
import { TextDecoder, TextEncoder } from "util";

if (typeof globalThis.TextDecoder === "undefined") {
  // @ts-expect-error — Node's util.TextDecoder is structurally compatible
  globalThis.TextDecoder = TextDecoder;
}
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}

// jsdom lacks matchMedia; antd's responsive observer requires it.
if (typeof window.matchMedia === "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}
