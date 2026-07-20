import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { FormRenderer } from "./FormRenderer";
import { Tag } from "../../nostr/types";

// Keep the test focused on FormRenderer's step logic
jest.mock("./FormFields", () => ({
  FormFields: ({ fields }: { fields: any[] }) => (
    <div data-testid="visible-fields">{fields.map((f) => f[1]).join(",")}</div>
  ),
}));
jest.mock("./components", () => ({
  AutoSaveIndicator: () => null,
  FormSettingsPopover: () => null,
}));
// react-markdown's dependency tree uses package "exports" subpaths that
// jest 27 cannot resolve — the markdown renderer is irrelevant to step logic.
jest.mock("../../components/SafeMarkdown", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

i18n.use(initReactI18next).init({
  lng: "en",
  resources: {},
});

const sectionedTemplate: Tag[] = [
  ["name", "Sectioned form"],
  [
    "settings",
    JSON.stringify({
      sections: [
        { id: "s1", title: "Section One", questionIds: ["q2"] },
        { id: "s2", title: "Section Two", questionIds: ["q3"] },
      ],
    }),
  ],
  ["field", "q1", "First question", "text"],
  ["field", "q2", "Second question", "text"],
  ["field", "q3", "Third question", "text"],
];

const Harness = ({ formTemplate }: { formTemplate: Tag[] }) => (
  <FormRenderer
    formTemplate={formTemplate}
    onInput={() => {}}
    footer={<button type="submit">Submit form</button>}
  />
);

const visibleFields = () => screen.getByTestId("visible-fields").textContent;

describe("FormRenderer sections", () => {
  it("renders the stepper with section titles and starts on the first step", () => {
    render(<Harness formTemplate={sectionedTemplate} />);

    expect(screen.getByText("Section One")).toBeInTheDocument();
    expect(screen.getByText("Section Two")).toBeInTheDocument();
    expect(visibleFields()).toBe("q1");
  });

  it("advances to the next section on Continue and back on Back", async () => {
    render(<Harness formTemplate={sectionedTemplate} />);

    await userEvent.click(screen.getByText(/continue/i));
    await waitFor(() => expect(visibleFields()).toBe("q2"));

    await userEvent.click(screen.getByText(/back/i));
    await waitFor(() => expect(visibleFields()).toBe("q1"));
  });

  it("only shows the footer on the last step", async () => {
    render(<Harness formTemplate={sectionedTemplate} />);

    expect(screen.queryByText("Submit form")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText(/continue/i));
    await waitFor(() => expect(visibleFields()).toBe("q2"));
    await userEvent.click(screen.getByText(/continue/i));
    await waitFor(() => expect(visibleFields()).toBe("q3"));

    expect(screen.getByText("Submit form")).toBeInTheDocument();
  });

  it("clicking the next step validates and advances (previously dead code)", async () => {
    render(<Harness formTemplate={sectionedTemplate} />);

    await userEvent.click(screen.getByText("Section One"));
    await waitFor(() => expect(visibleFields()).toBe("q2"));
  });

  it("does not allow skipping ahead more than one step", async () => {
    render(<Harness formTemplate={sectionedTemplate} />);

    await userEvent.click(screen.getByText("Section Two"));
    // stays on the first step
    expect(visibleFields()).toBe("q1");
  });

  it("allows jumping back to an earlier step via the stepper", async () => {
    render(<Harness formTemplate={sectionedTemplate} />);

    await userEvent.click(screen.getByText(/continue/i));
    await waitFor(() => expect(visibleFields()).toBe("q2"));

    await userEvent.click(screen.getByText("common.labels.generalQuestions"));
    await waitFor(() => expect(visibleFields()).toBe("q1"));
  });
});
