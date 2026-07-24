import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { Dashboard } from "./index";
import { muiTheme } from "../../theme/muiTheme";
import { ILocalForm } from "../CreateFormNew/providers/FormBuilder/typeDefs";

/**
 * Phase 4: dashboard container states (loading / empty / cards) and the
 * filter tabs that replaced the antd dropdown. Heavy nostr/provider seams
 * are mocked; card components render for real (MUI).
 */

const mockLocalFormsState: {
  localForms: ILocalForm[];
  isLoading: boolean;
  isEncrypted: boolean;
  encryptionMeta: { encryptedBy?: string } | null;
  refreshForms: jest.Mock;
  deleteLocalForm: jest.Mock;
} = {
  localForms: [],
  isLoading: false,
  isEncrypted: false,
  encryptionMeta: null,
  refreshForms: jest.fn(),
  deleteLocalForm: jest.fn(),
};

jest.mock("../../hooks/useProfileContext", () => ({
  useProfileContext: () => ({ pubkey: undefined }),
}));

jest.mock("../../provider/LocalFormsProvider", () => ({
  useLocalForms: () => mockLocalFormsState,
}));

// MyFormsProvider pulls the @formstr/signer chain jest can't resolve; the
// MyForms tab isn't exercised here.
jest.mock("../../provider/MyFormsProvider", () => ({
  useMyForms: () => ({
    formEvents: new Map(),
    refreshing: false,
    deleteForm: jest.fn(),
    retryForm: jest.fn(),
    refreshForms: jest.fn(),
  }),
}));

// The DataLayer spawns a Web Worker (import.meta.url) that jsdom can't run,
// so mock the module the migrated components read from.
jest.mock("../../dataLayer", () => ({
  subscribe: jest.fn(() => ({ close: jest.fn() })),
  fetchOne: jest.fn(async () => null),
  fetchMany: jest.fn(async () => []),
  setUserRelays: jest.fn(),
}));

// axios ships ESM which jest doesn't transform; Purchases isn't exercised.
jest.mock("../../utils/axiosInstance", () => ({
  __esModule: true,
  default: { get: jest.fn(async () => ({ data: [] })) },
}));

jest.mock("../../nostr/common", () => ({
  getDefaultRelays: () => ["wss://relay.mock"],
}));

// Heavy modal with its own provider deps — keep it out of this test's tree.
jest.mock("../../components/ImportFormModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../CreateFormNew/components/FormDetails", () => ({
  FormDetails: () => null,
}));

// Cards call deep url builders (nostr-tools ESM chain) — stub them.
jest.mock("../../utils/formUtils", () => ({
  createFormSpecFromTemplate: jest.fn(() => ({ spec: [], id: "t1" })),
  editPath: jest.fn(() => "/mock-edit"),
  responsePath: jest.fn(() => "/mock-response"),
  getDecryptedForm: jest.fn(() => []),
  getFormData: jest.fn(async () => []),
}));

jest.mock("../../utils/utility", () => ({
  makeFormNAddr: jest.fn(() => "naddr1mock"),
  naddrUrl: jest.fn(() => "/mock-naddr"),
  makeTag: jest.fn(() => "abc123"),
  downloadHTMLToDevice: jest.fn(),
  deleteDraft: jest.fn(),
  isMobile: () => false,
  truncateNpub: (pk: string) => pk,
}));

// Heavy modal with its own coverage hooks — keep it out of this test's tree.
jest.mock("../../components/BroadcastModal", () => ({
  BroadcastModal: () => null,
}));

jest.mock("../../hooks/useRelayCoverage", () => ({
  useRelayCoverage: () => ({ loading: false, foundCount: 1, total: 1 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

// react-markdown's dependency tree uses package "exports" subpaths that
// jest 27 cannot resolve — the markdown renderer is irrelevant here.
jest.mock("../../components/SafeMarkdown", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const renderDashboard = (initialRoute = "/dashboard/local") =>
  render(
    <ThemeProvider theme={muiTheme}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Dashboard />
      </MemoryRouter>
    </ThemeProvider>,
  );

const aLocalForm = (name: string): ILocalForm => ({
  key: `key-${name}`,
  name,
  createdAt: new Date().toISOString(),
  publicKey: "pubkey1",
  privateKey: "privkey1",
  formId: `form-${name}`,
  relay: "wss://relay.mock",
  relays: ["wss://relay.mock"],
});

describe("Dashboard", () => {
  beforeEach(() => {
    mockLocalFormsState.localForms = [];
    mockLocalFormsState.isLoading = false;
    mockLocalFormsState.isEncrypted = false;
    jest.clearAllMocks();
  });

  it("renders the filter tabs and the import action", () => {
    renderDashboard();
    expect(
      screen.getByRole("tab", { name: "dashboard.filters.local" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "dashboard.filters.submissions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /dashboard.import/ }),
    ).toBeInTheDocument();
  });

  it("shows a spinner while local forms load", () => {
    mockLocalFormsState.isLoading = true;
    renderDashboard();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows the empty state with templates when there are no forms", () => {
    renderDashboard();
    expect(screen.getByText("builder.templateEmptyTitle")).toBeInTheDocument();
  });

  it("renders a card per local form", () => {
    mockLocalFormsState.localForms = [aLocalForm("Feedback form")];
    renderDashboard();
    expect(screen.getByText("Feedback form")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "dashboardCards.viewResponses" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "dashboardCards.openForm" }),
    ).toBeInTheDocument();
  });

  it("switches filters via the tabs", () => {
    renderDashboard();
    fireEvent.click(
      screen.getByRole("tab", { name: "dashboard.filters.submissions" }),
    );
    // Submissions is empty on-device → its empty state shows.
    expect(screen.getByText("dashboard.submissionsEmpty")).toBeInTheDocument();
  });

  it("disables account-bound filters when logged out", () => {
    renderDashboard();
    expect(
      screen.getByRole("tab", { name: "dashboard.filters.shared" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("tab", { name: "dashboard.filters.myForms" }),
    ).toBeDisabled();
  });
});
