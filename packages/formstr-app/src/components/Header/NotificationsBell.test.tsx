import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { NotificationsBell } from "./NotificationsBell";
import { muiTheme } from "../../theme/muiTheme";

const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();
const mockFindOwnedForm = jest.fn();

const mockNotifications = [
  {
    id: "n1",
    type: "response",
    formPubkey: "pk1",
    formId: "f1",
    formName: "My Form",
    relays: [],
    createdAt: 1700000000,
    seenAt: undefined,
  },
  {
    id: "n2",
    type: "share",
    formPubkey: "pk2",
    formId: "f2",
    formName: "Shared Form",
    relays: [],
    createdAt: 1700000100,
    seenAt: 1700000200,
  },
];

jest.mock("../../provider/NotificationsProvider", () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: 1,
    markRead: mockMarkRead,
    markAllRead: mockMarkAllRead,
    findOwnedForm: mockFindOwnedForm,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

// These utils pull in the nostr-tools chain, which jest can't resolve
// (ESM subpath "nostr-tools/utils"); the bell only needs them for navigation.
jest.mock("../../utils/formUtils", () => ({
  responsePath: jest.fn(() => "/mock-response-path"),
}));
jest.mock("../../utils/utility", () => ({
  makeFormNAddr: jest.fn(() => "naddr1mock"),
  naddrUrl: jest.fn(() => "/mock-naddr-url"),
  truncateNpub: (pk: string) => pk,
}));

const renderBell = () =>
  render(
    <ThemeProvider theme={muiTheme}>
      <MemoryRouter>
        <NotificationsBell />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe("NotificationsBell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the bell with the unread count badge", () => {
    renderBell();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /notifications\.bellLabel/,
      }),
    ).toBeInTheDocument();
  });

  it("opens the panel and lists notifications on click", () => {
    renderBell();
    fireEvent.click(screen.getByRole("button", { name: /bellLabel/ }));
    expect(
      screen.getByText(/notifications\.responseText/),
    ).toBeInTheDocument();
    expect(screen.getByText(/notifications\.shareText/)).toBeInTheDocument();
  });

  it("marks all read from the panel header", () => {
    renderBell();
    fireEvent.click(screen.getByRole("button", { name: /bellLabel/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "notifications.markAllRead" }),
    );
    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("marks a notification read when selected", () => {
    renderBell();
    fireEvent.click(screen.getByRole("button", { name: /bellLabel/ }));
    fireEvent.click(screen.getByText(/notifications\.shareText/));
    expect(mockMarkRead).toHaveBeenCalledWith("n2");
  });
});
