import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SubmitButton } from "./submit";
import { Event } from "nostr-tools";
import { Tag } from "../../../nostr/types";
import en from "../../../i18n/resources/en";

const mockSendResponses = jest.fn();
const mockSendNRPCWebhook = jest.fn();
const mockRecordSubmission = jest.fn();

jest.mock(
  "nostr-tools/utils",
  () => ({
    normalizeURL: (url: string) => url,
  }),
  { virtual: true },
);

jest.mock("../../../nostr/common", () => ({
  NO_RELAYS_ACCEPTED_ERROR_CODE: "NO_RELAYS_ACCEPTED",
  sendResponses: (...args: any[]) => mockSendResponses(...args),
  sendNRPCWebhook: (...args: any[]) => mockSendNRPCWebhook(...args),
}));

jest.mock("../../../utils/submissions", () => ({
  recordSubmission: (...args: any[]) => mockRecordSubmission(...args),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: any) => {
      const translations: Record<string, string> = {
        "common.actions.submit": "Submit",
        "common.actions.tryAgain": "Try Again",
        "filler.submit.tryAgain": "Try Again",
        "filler.submit.noRelaysAccepted":
          "No relays accepted your response. It has not been submitted. Please contact the form owner.",
        "filler.submit.submissionFailed": "Submission could not be completed.",
        "filler.submit.postPublishFailed":
          "Your response was accepted, but confirmation could not be shown.",
        "filler.submit.submitting": "Submitting...",
        "filler.submit.relayStatusTitle": "Submitting Response",
        "filler.submit.errorPrefix": "Error",
      };
      if (typeof defaultValue === "string" && !translations[key]) return defaultValue;
      return translations[key] || key;
    },
  }),
}));

jest.mock("../../../hooks/useProfileContext", () => ({
  useProfileContext: () => ({
    pubkey: "mock-user-pubkey",
    requestPubkey: jest.fn().mockResolvedValue("mock-user-pubkey"),
  }),
}));

const mockFormEvent: Event = {
  id: "mock-event-id",
  pubkey: "mock-author-pubkey",
  created_at: 1000,
  kind: 30168,
  tags: [
    ["d", "mock-form-id"],
    ["name", "Test Form"],
    ["relay", "wss://relay.example.com"],
  ],
  content: "",
  sig: "mock-sig",
};

const mockFormTemplate: Tag[] = [
  ["d", "mock-form-id"],
  ["name", "Test Form"],
  ["relay", "wss://relay.example.com"],
];

describe("SubmitButton", () => {
  let originalAlert: typeof window.alert;

  beforeEach(() => {
    jest.clearAllMocks();
    originalAlert = window.alert;
    window.alert = jest.fn();
  });

  afterEach(() => {
    window.alert = originalAlert;
  });

  it("submits successfully when relay accepts response", async () => {
    mockSendResponses.mockImplementation(
      async (_pub, _id, _resp, _anon, _enc, _relays, onAccepted) => {
        onAccepted("wss://relay.example.com");
        return {
          acceptedRelays: ["wss://relay.example.com"],
          relayList: ["wss://relay.example.com"],
          messages: [{ status: "fulfilled", value: "OK" }],
        };
      },
    );

    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <SubmitButton
        selfSign={false}
        edit={false}
        validateForm={() => true}
        getResponses={() => [["response", "q1", "answer1", "{}"]]}
        formEvent={mockFormEvent}
        onSubmit={mockOnSubmit}
        relays={["wss://relay.example.com"]}
        formTemplate={mockFormTemplate}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: "Submit" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSendResponses).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockRecordSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          formId: "mock-form-id",
          formPubkey: "mock-author-pubkey",
          relays: ["wss://relay.example.com"],
        }),
      );
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByTestId("submit-error")).not.toBeInTheDocument();
  });

  it("shows retry only when all relays reject the response", async () => {
    mockSendResponses.mockRejectedValue(
      Object.assign(new Error("No relays accepted the response"), {
        code: "NO_RELAYS_ACCEPTED",
      }),
    );

    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <SubmitButton
        selfSign={false}
        edit={false}
        validateForm={() => true}
        getResponses={() => [["response", "q1", "answer1", "{}"]]}
        formEvent={mockFormEvent}
        onSubmit={mockOnSubmit}
        relays={["wss://relay.example.com"]}
        formTemplate={mockFormTemplate}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: "Submit" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSendResponses).toHaveBeenCalledTimes(1);
    });

    // Confirmation / thank you must NOT be triggered
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockRecordSubmission).not.toHaveBeenCalled();

    // Show one inline error instead of stacking alerts and snackbars.
    await waitFor(() => {
      expect(window.alert).not.toHaveBeenCalled();
    });

    // Error message must be visible
    const errorEl = await screen.findByTestId("submit-error");
    expect(errorEl).toHaveTextContent(
      "No relays accepted your response. It has not been submitted. Please contact the form owner.",
    );
    expect(screen.getByText("Submitting Response")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No relays accepted your response. It has not been submitted. Please contact the form owner.",
      ),
    ).toBeInTheDocument();
    expect(errorEl).toHaveTextContent(en.filler.submit.noRelaysAccepted);

    // Button should now show "Try Again"
    const tryAgainBtn = await screen.findByRole("button", { name: "Try Again" });
    expect(tryAgainBtn).toBeInTheDocument();
    expect(tryAgainBtn).not.toBeDisabled();

    // Clicking Try Again retries submission
    mockSendResponses.mockImplementation(
      async (_pub, _id, _resp, _anon, _enc, _relays, onAccepted) => {
        onAccepted("wss://relay.example.com");
        return {
          acceptedRelays: ["wss://relay.example.com"],
          relayList: ["wss://relay.example.com"],
          messages: [{ status: "fulfilled", value: "OK" }],
        };
      },
    );

    fireEvent.click(tryAgainBtn);

    await waitFor(() => {
      expect(mockSendResponses).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockRecordSubmission).toHaveBeenCalledTimes(1);
    });
  });

  it("handles empty acceptedRelays returned from sendResponses", async () => {
    // sendResponses now throws when no relays accept rather than returning
    // an empty list, so we mock a rejection with the coded error.
    mockSendResponses.mockRejectedValue(
      Object.assign(new Error("No relays accepted the response"), {
        code: "NO_RELAYS_ACCEPTED",
        relayList: ["wss://relay.example.com"],
        messages: [{ status: "rejected", reason: "timeout" }],
      }),
    );

    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <SubmitButton
        selfSign={false}
        edit={false}
        validateForm={() => true}
        getResponses={() => [["response", "q1", "answer1", "{}"]]}
        formEvent={mockFormEvent}
        onSubmit={mockOnSubmit}
        relays={["wss://relay.example.com"]}
        formTemplate={mockFormTemplate}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: "Submit" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSendResponses).toHaveBeenCalledTimes(1);
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockRecordSubmission).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    });
  });

  it("continues when at least one relay accepts the response", async () => {
    mockSendResponses.mockImplementation(
      async (_pub, _id, _resp, _anon, _enc, _relays, onAccepted) => {
        onAccepted("wss://accepted.example.com");
        return {
          acceptedRelays: ["wss://accepted.example.com"],
          relayList: ["wss://accepted.example.com", "wss://rejected.example.com"],
          messages: [
            { status: "fulfilled", value: "OK" },
            { status: "rejected", reason: "offline" },
          ],
        };
      },
    );

    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <SubmitButton
        selfSign={false}
        edit={false}
        validateForm={() => true}
        getResponses={() => [["response", "q1", "answer1", "{}"]]}
        formEvent={mockFormEvent}
        onSubmit={mockOnSubmit}
        relays={["wss://accepted.example.com", "wss://rejected.example.com"]}
        formTemplate={mockFormTemplate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockRecordSubmission).toHaveBeenCalledWith(
        expect.objectContaining({ relays: ["wss://accepted.example.com"] }),
      );
    });

    expect(screen.queryByRole("button", { name: "Try Again" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("submit-error")).not.toBeInTheDocument();
  });

  it("does not offer relay retry when post-publish confirmation fails", async () => {
    mockSendResponses.mockResolvedValue({
      acceptedRelays: ["wss://relay.example.com"],
      relayList: ["wss://relay.example.com"],
      messages: [{ status: "fulfilled", value: "OK" }],
    });

    render(
      <SubmitButton
        selfSign={false}
        edit={false}
        validateForm={() => true}
        getResponses={() => [["response", "q1", "answer1", "{}"]]}
        formEvent={mockFormEvent}
        onSubmit={jest.fn().mockRejectedValue(new Error("confirmation failed"))}
        relays={["wss://relay.example.com"]}
        formTemplate={mockFormTemplate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByTestId("submit-error")).toHaveTextContent(
      "Your response was accepted, but confirmation could not be shown.",
    );
    expect(screen.queryByRole("button", { name: "Try Again" })).not.toBeInTheDocument();
    expect(window.alert).not.toHaveBeenCalled();
  });
});
