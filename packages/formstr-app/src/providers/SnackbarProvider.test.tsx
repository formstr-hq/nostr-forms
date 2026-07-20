import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { SnackbarProvider, useSnackbar } from "./SnackbarProvider";
import { muiTheme } from "../theme/muiTheme";

const Trigger = ({
  text,
  severity,
}: {
  text: string;
  severity?: "success" | "error" | "info" | "warning";
}) => {
  const { showMessage } = useSnackbar();
  return (
    <button onClick={() => showMessage(text, severity)}>trigger</button>
  );
};

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <ThemeProvider theme={muiTheme}>
      <SnackbarProvider>{ui}</SnackbarProvider>
    </ThemeProvider>,
  );

describe("SnackbarProvider", () => {
  it("shows a message when showMessage is called", () => {
    renderWithProviders(<Trigger text="Saved!" severity="success" />);
    fireEvent.click(screen.getByText("trigger"));
    expect(screen.getByText("Saved!")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-colorSuccess");
  });

  it("defaults to info severity", () => {
    renderWithProviders(<Trigger text="Heads up" />);
    fireEvent.click(screen.getByText("trigger"));
    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-colorInfo");
  });

  it("replaces a previous message with the latest one", () => {
    renderWithProviders(
      <>
        <Trigger text="first" severity="error" />
        <Trigger text="second" severity="success" />
      </>,
    );
    const buttons = screen.getAllByText("trigger");
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(screen.getByText("second")).toBeInTheDocument();
    expect(screen.queryByText("first")).not.toBeInTheDocument();
  });
});
