import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TitleImage from "./TitleImage";
import { BackgroundImageSetting } from "./BackgroundImage";
import { ThankYouScreenImageSetting } from "./ThankYouImage";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { BlossomClient } from "../../../../utils/blossom";
import { createAuthEvent } from "../../../../utils/blossomAuth";

jest.mock("../../hooks/useFormBuilderContext", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../../../utils/blossom");
jest.mock("../../../../utils/blossomAuth", () => ({
  createAuthEvent: jest.fn(),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const updateFormSetting = jest.fn();
const upload = jest.fn();

beforeEach(() => {
  (useFormBuilderContext as jest.Mock).mockReturnValue({ updateFormSetting });
  (BlossomClient as jest.Mock).mockImplementation(() => ({ upload }));
  (createAuthEvent as jest.Mock).mockResolvedValue("Nostr signed-event");
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      subtle: {
        digest: jest.fn().mockResolvedValue(new Uint8Array(32).buffer),
      },
    },
  });
});

describe.each(["title", "background", "thank-you"])("%s image", (setting) => {
  const onChange = jest.fn();
  function selectFile(type = "image/png") {
    const oldUrl = "https://example.com/old.png";
    const { container } = render(
      setting === "title" ? (
        <TitleImage titleImageUrl={oldUrl} />
      ) : setting === "background" ? (
        <BackgroundImageSetting value={oldUrl} onChange={onChange} />
      ) : (
        <ThankYouScreenImageSetting value={oldUrl} onChange={onChange} />
      ),
    );
    const file = new File(["image"], "title.png", { type });
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => new Uint8Array([1, 2, 3]).buffer,
    });
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    });
  }

  test("uploads the image with its MIME type and applies the returned URL", async () => {
    upload.mockResolvedValue(
      JSON.stringify({ url: "https://nostr.download/image.png" }),
    );
    selectFile();
    await waitFor(() =>
      setting === "title"
        ? expect(updateFormSetting).toHaveBeenCalledWith({
            titleImageUrl: "https://nostr.download/image.png",
          })
        : expect(onChange).toHaveBeenCalledWith(
            "https://nostr.download/image.png",
          ),
    );
    expect(createAuthEvent).toHaveBeenCalledWith("upload", "0".repeat(64));
    expect(upload).toHaveBeenCalledWith(
      new Uint8Array([1, 2, 3]),
      "Nostr signed-event",
      "image/png",
    );
  });

  test("keeps the existing image when an upload fails", async () => {
    upload.mockRejectedValue(new Error("Network error"));
    selectFile();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "imageUploadFailed",
    );
    expect(updateFormSetting).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue(
      "https://example.com/old.png",
    );
  });

  test("rejects non-image files before uploading", async () => {
    selectFile("text/plain");
    expect(screen.getByRole("alert")).toHaveTextContent("imageFileRequired");
    expect(upload).not.toHaveBeenCalled();
    expect(updateFormSetting).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
