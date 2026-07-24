import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { QuestionsList } from "./index";
import { muiTheme } from "../../../../theme/muiTheme";
import { AnswerTypes, Field } from "../../../../nostr/types";

/**
 * Phase 5: builder question list — add/edit/reorder and section grouping,
 * with the builder context mocked (the real provider pulls the nostr
 * signer chain jest can't resolve).
 */

const aField = (tempId: string, label: string): Field => [
  "field",
  tempId,
  "text",
  label,
  "[]",
  JSON.stringify({ renderElement: AnswerTypes.shortText }),
];

const mockBuilderState: {
  questionsList: Field[];
  sections: Array<{
    id: string;
    title: string;
    description?: string;
    questionIds: string[];
  }>;
  editQuestion: jest.Mock;
  updateQuestionsList: jest.Mock;
  updateFormSetting: jest.Mock;
  setQuestionIdInFocus: jest.Mock;
  setIsLeftMenuOpen: jest.Mock;
  deleteQuestion: jest.Mock;
  getSectionForQuestion: (id: string) => string | undefined;
  moveQuestionToSection: jest.Mock;
} = {
  questionsList: [],
  sections: [],
  editQuestion: jest.fn(),
  updateQuestionsList: jest.fn(),
  updateFormSetting: jest.fn(),
  setQuestionIdInFocus: jest.fn(),
  setIsLeftMenuOpen: jest.fn(),
  deleteQuestion: jest.fn(),
  getSectionForQuestion: () => undefined,
  moveQuestionToSection: jest.fn(),
};

jest.mock("../../hooks/useFormBuilderContext", () => ({
  __esModule: true,
  default: () => ({
    formSettings: { cardTransparency: 1 },
    questionsList: mockBuilderState.questionsList,
    sections: mockBuilderState.sections,
    editQuestion: mockBuilderState.editQuestion,
    updateQuestionsList: mockBuilderState.updateQuestionsList,
    updateFormSetting: mockBuilderState.updateFormSetting,
    setQuestionIdInFocus: mockBuilderState.setQuestionIdInFocus,
    setIsLeftMenuOpen: mockBuilderState.setIsLeftMenuOpen,
    deleteQuestion: mockBuilderState.deleteQuestion,
    getSectionForQuestion: mockBuilderState.getSectionForQuestion,
    moveQuestionToSection: mockBuilderState.moveQuestionToSection,
    bottomElementRef: { current: null },
    isAiModalOpen: false,
    setIsAiModalOpen: jest.fn(),
    isImportModalVisible: false,
    setIsImportModalVisible: jest.fn(),
    handleAIFormGenerated: jest.fn(),
    updateFormName: jest.fn(),
    formName: "Test form",
    toggleSettingsWindow: jest.fn(),
  }),
}));

// The modals pull the ollama/google-deployer chains — irrelevant here.
jest.mock("../AIFormGeneratorModal", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../GoogleFormImportModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../../../../providers/SnackbarProvider", () => ({
  useSnackbar: () => ({ showMessage: jest.fn() }),
}));

// pool pulls the nostr signer chain (file-upload settings subscribe to
// relays) — irrelevant to list logic.
// The DataLayer spawns a Web Worker (import.meta.url) that jsdom can't run,
// so mock the module the migrated components read from.
jest.mock("../../../../dataLayer", () => ({
  subscribe: jest.fn(() => ({ close: jest.fn() })),
  fetchOne: jest.fn(async () => null),
  fetchMany: jest.fn(async () => []),
  setUserRelays: jest.fn(),
}));

// react-markdown's dependency tree uses package "exports" subpaths that
// jest 27 cannot resolve — the markdown renderer is irrelevant here.
jest.mock("../../../../components/SafeMarkdown", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

const renderList = () =>
  render(
    <ThemeProvider theme={muiTheme}>
      <MemoryRouter>
        <QuestionsList />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe("QuestionsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuilderState.questionsList = [];
    mockBuilderState.sections = [];
    mockBuilderState.getSectionForQuestion = () => undefined;
  });

  it("shows the empty state when there are no questions", () => {
    renderList();
    expect(screen.getByText("builder.questionsList.empty")).toBeInTheDocument();
  });

  it("renders one card per question", () => {
    mockBuilderState.questionsList = [
      aField("q1", "First question"),
      aField("q2", "Second question"),
    ];
    renderList();
    expect(screen.getByDisplayValue("First question")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Second question")).toBeInTheDocument();
  });

  it("edits the question label through the builder context", () => {
    mockBuilderState.questionsList = [aField("q1", "Old label")];
    renderList();
    fireEvent.change(screen.getByDisplayValue("Old label"), {
      target: { value: "New label" },
    });
    expect(mockBuilderState.editQuestion).toHaveBeenCalledTimes(1);
    const [field, tempId] = mockBuilderState.editQuestion.mock.calls[0];
    expect(field[3]).toBe("New label");
    expect(tempId).toBe("q1");
  });

  it("reorders questions via the move down button", () => {
    mockBuilderState.questionsList = [
      aField("q1", "First"),
      aField("q2", "Second"),
    ];
    renderList();
    fireEvent.mouseDown(screen.getByLabelText("move question down"));
    expect(mockBuilderState.updateQuestionsList).toHaveBeenCalledTimes(1);
    const updater = mockBuilderState.updateQuestionsList.mock.calls[0][0];
    const reordered = updater(mockBuilderState.questionsList);
    expect(reordered.map((q: Field) => q[1])).toEqual(["q2", "q1"]);
  });

  it("groups questions under their sections and lists unsectioned ones", () => {
    mockBuilderState.questionsList = [
      aField("q1", "Loose question"),
      aField("q2", "Sectioned question"),
    ];
    mockBuilderState.sections = [
      {
        id: "sec1",
        title: "Section One",
        questionIds: ["q2"],
      },
    ];
    mockBuilderState.getSectionForQuestion = (id: string) =>
      id === "q2" ? "sec1" : undefined;
    renderList();
    expect(
      screen.getByText("builder.questionsList.unsectionedQuestions"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Loose question")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sectioned question")).toBeInTheDocument();
  });

  it("deletes a question through the card header", () => {
    mockBuilderState.questionsList = [aField("q1", "Doomed question")];
    renderList();
    fireEvent.click(screen.getByLabelText("delete question"));
    // Two-step delete: the undo icon appears, actual delete fires on timeout.
    expect(screen.getByLabelText("undo delete")).toBeInTheDocument();
  });
});
