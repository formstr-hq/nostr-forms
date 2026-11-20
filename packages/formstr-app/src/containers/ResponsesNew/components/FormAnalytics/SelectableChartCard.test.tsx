import React from "react";
import { act, render, screen, within, waitFor } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material";
import userEvent from "@testing-library/user-event";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import en from "../../../../i18n/resources/en";
import { ChoiceChart } from "./ChoiceChart";
import { NumberChart } from "./NumberChart";
import { DateChart } from "./DateChart";

// jsdom has no layout engine; give the real Recharts charts measurable dimensions.
jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  const React = jest.requireActual("react");
  return {
    ...actual,
    Bar: (props: any) =>
      React.createElement(actual.Bar, { ...props, isAnimationActive: false }),
    Pie: (props: any) =>
      React.createElement(actual.Pie, { ...props, isAnimationActive: false }),
    Line: (props: any) =>
      React.createElement(actual.Line, { ...props, isAnimationActive: false }),
    Area: (props: any) =>
      React.createElement(actual.Area, { ...props, isAnimationActive: false }),
    ResponsiveContainer: ({ children, height }: any) =>
      React.cloneElement(children, { width: 600, height }),
  };
});

const i18n = createInstance();
beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: "en",
    resources: { en: { translation: en } },
    interpolation: { escapeValue: false },
  });
});

const testTheme = createTheme({
  components: { MuiButtonBase: { defaultProps: { disableRipple: true } } },
});

const renderChart = (chart: React.ReactElement) =>
  render(
    <ThemeProvider theme={testTheme}>
      <I18nextProvider i18n={i18n}>{chart}</I18nextProvider>
    </ThemeProvider>,
  );

const choiceData = [
  {
    option: "First option with a long descriptive name",
    count: 3,
    percentage: 75,
  },
  { option: "Second option", count: 1, percentage: 25 },
];

async function selectType(label: string, type: string) {
  userEvent.click(
    screen.getByRole("button", {
      name: new RegExp(`Chart type for ${label}:`),
    }),
  );
  userEvent.click(screen.getByRole("menuitemradio", { name: type }));
  await waitFor(() =>
    expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
  );
}

test("choice charts switch to pie and doughnut and restore the original bar labels", async () => {
  const { container } = renderChart(
    <ChoiceChart
      label="Choices"
      fieldType="radioButton"
      data={choiceData}
      totalAnswered={4}
    />,
  );
  expect(container.querySelector(".recharts-bar")).toBeInTheDocument();
  expect(screen.getByText("75%")).toBeInTheDocument();
  await selectType("Choices", "Pie");
  expect(container.querySelector(".recharts-pie")).toBeInTheDocument();
  const legend = screen.getByRole("list", { name: "Chart legend" });
  expect(within(legend).getAllByRole("listitem")).toHaveLength(2);
  expect(legend).toHaveTextContent(
    "First option with a long descriptive name — 3 (75%)",
  );
  await selectType("Choices", "Doughnut");
  expect(container.querySelector(".recharts-pie")).toBeInTheDocument();
  await selectType("Choices", "Bar");
  expect(container.querySelector(".recharts-bar")).toBeInTheDocument();
  expect(screen.getByText("75%")).toBeInTheDocument();
});

test("date menus expose sequential types with keyboard access and an associated label", async () => {
  const { container } = renderChart(
    <DateChart
      label="Dates"
      fieldType="date"
      data={[{ date: "2026-11-01", count: 2 }]}
      totalAnswered={2}
    />,
  );
  const button = screen.getByRole("button", {
    name: "Chart type for Dates: Area",
  });
  act(() => button.focus());
  userEvent.keyboard("{Enter}");
  const menu = screen.getByRole("menu", { name: "Chart type for Dates: Area" });
  expect(button).toHaveAttribute("aria-controls", menu.id);
  expect(
    within(menu)
      .getAllByRole("menuitemradio")
      .map((item) => item.textContent),
  ).toEqual(["Area", "Bar", "Line"]);
  expect(screen.getByRole("menuitemradio", { name: "Area" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  userEvent.keyboard("{ArrowDown}{Enter}");
  await waitFor(() =>
    expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
  );
  expect(container.querySelector(".recharts-bar")).toBeInTheDocument();
  await selectType("Dates", "Line");
  expect(container.querySelector(".recharts-line")).toBeInTheDocument();
  await selectType("Dates", "Area");
  expect(container.querySelector(".recharts-area")).toBeInTheDocument();
});

test("numeric distributions offer only bar and line", async () => {
  const { container } = renderChart(
    <NumberChart
      label="Numbers"
      data={[{ range: "1–5", count: 2, min: 1, max: 5 }]}
      totalAnswered={2}
    />,
  );
  userEvent.click(
    screen.getByRole("button", { name: "Chart type for Numbers: Bar" }),
  );
  expect(
    screen.getAllByRole("menuitemradio").map((item) => item.textContent),
  ).toEqual(["Bar", "Line"]);
  userEvent.click(screen.getByRole("menuitemradio", { name: "Line" }));
  expect(container.querySelector(".recharts-line")).toBeInTheDocument();
});

test("multi-select explanation remains visible and circular shares use selection totals", async () => {
  renderChart(
    <ChoiceChart
      label="Choices"
      fieldType="checkboxes"
      data={[
        { option: "A", count: 3, percentage: 100 },
        { option: "B", count: 3, percentage: 100 },
      ]}
      totalAnswered={3}
    />,
  );
  expect(
    screen.getByText("Each respondent can select multiple options."),
  ).toBeInTheDocument();
  await selectType("Choices", "Pie");
  expect(
    screen.getByText(/Slices show the share of selections, not respondents/),
  ).toBeInTheDocument();
  expect(screen.getByRole("list", { name: "Chart legend" })).toHaveTextContent(
    "A — 3 (50%)",
  );
});

test("empty circular charts show a message and chart selections are independent", async () => {
  renderChart(
    <>
      <ChoiceChart
        label="Empty"
        fieldType="radioButton"
        data={[{ option: "A", count: 0, percentage: 0 }]}
        totalAnswered={0}
      />
      <ChoiceChart
        label="Other"
        fieldType="radioButton"
        data={choiceData}
        totalAnswered={4}
      />
    </>,
  );
  await selectType("Empty", "Pie");
  expect(screen.getByText("No data to display.")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Chart type for Other: Bar" }),
  ).toBeInTheDocument();
});
