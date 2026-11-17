import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { muiTheme } from "../../theme/muiTheme";
import GGUFFileSelector from "./GGUFFileSelector";

const renderSelector = () =>
  render(
    <ThemeProvider theme={muiTheme}>
      <GGUFFileSelector
        onFileSelected={jest.fn().mockResolvedValue(undefined)}
      />
    </ThemeProvider>,
  );

describe("GGUFFileSelector model guide", () => {
  it("starts with the model guide collapsed", () => {
    renderSelector();

    const summary = screen.getByRole("button", { name: /get a model/i });
    expect(summary).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByText(/download a model, return here/i),
    ).not.toBeVisible();
  });

  it("shows usable download links when expanded", () => {
    renderSelector();

    fireEvent.click(screen.getByRole("button", { name: /get a model/i }));

    const downloads = screen.getAllByRole("link", {
      name: /download gguf for/i,
    });
    const expectedDownloadUrls = [
      "https://huggingface.co/unsloth/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct-Q8_0.gguf?download=true",
      "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf?download=true",
      "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf?download=true",
    ];

    expect(downloads).toHaveLength(expectedDownloadUrls.length);
    downloads.forEach((download) => {
      expect(download).toHaveAttribute(
        "href",
        expectedDownloadUrls[downloads.indexOf(download)],
      );
      expect(download).toHaveAttribute("target", "_blank");
      expect(download).toHaveAttribute("rel", "noopener noreferrer");
    });
    expect(downloads[0].parentElement).toHaveStyle({ flexWrap: "wrap" });
    expect(
      screen.getAllByRole("link", { name: /model details for/i }),
    ).toHaveLength(3);
  });

  it("can be collapsed", () => {
    renderSelector();

    const summary = screen.getByRole("button", { name: /get a model/i });
    fireEvent.click(summary);
    fireEvent.click(summary);

    expect(summary).toHaveAttribute("aria-expanded", "false");
  });

  it("builds a Hugging Face GGUF search from the user's query", () => {
    renderSelector();

    fireEvent.click(screen.getByRole("button", { name: /get a model/i }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Search Hugging Face models" }),
      { target: { value: "gemma instruct" } },
    );

    const searchButton = screen.getByRole("link", {
      name: "Search Hugging Face models",
    });
    expect(searchButton).toHaveAttribute(
      "href",
      "https://huggingface.co/models?pipeline_tag=text-generation&library=gguf&search=gemma%20instruct",
    );
    expect(searchButton).not.toHaveTextContent(/search hugging face/i);
    expect(screen.getByTestId("SearchIcon")).toBeInTheDocument();
  });
});
