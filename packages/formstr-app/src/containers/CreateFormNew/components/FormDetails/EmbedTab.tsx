// EmbedTab.tsx
import { Box, Checkbox, FormControlLabel } from "@mui/material";
import { useState } from "react";
import { CopyButton } from "../../../../components/CopyButton";
import { constructEmbeddedUrl } from "../../../../utils/formUtils";

export const EmbedTab = ({
  pubKey,
  formId,
  relays,
  viewKey,
}: {
  pubKey: string;
  formId: string;
  relays: string[];
  viewKey?: string;
}) => {
  const [embedOptions, setEmbedOptions] = useState<{
    hideTitleImage?: boolean;
    hideDescription?: boolean;
  }>({});

  const toggleOption = (key: "hideTitleImage" | "hideDescription") =>
    setEmbedOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  const iframeHtml = `<iframe src="${constructEmbeddedUrl(
    pubKey,
    formId,
    embedOptions,
    relays,
    viewKey,
  )}" height="700px" width="480px" frameborder="0" style="border-style:none;box-shadow:0px 0px 2px 2px rgba(0,0,0,0.2);" cellspacing="0" ></iframe>`;

  return (
    <Box
      className="embedded-share"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Box
        className="settings-container"
        sx={{ display: "flex", justifyContent: "center", width: "100%" }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={!!embedOptions.hideTitleImage}
              onChange={() => toggleOption("hideTitleImage")}
              size="small"
            />
          }
          label="Hide Title Image"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={!!embedOptions.hideDescription}
              onChange={() => toggleOption("hideDescription")}
              size="small"
            />
          }
          label="Hide Description"
        />
      </Box>

      <Box
        className="embed-container"
        sx={{
          p: "10px",
          background:
            "radial-gradient(rgba(199, 199, 199, 1) 0%, rgba(255, 255, 255, 1) 100%)",
          mb: "10px",
          width: "60%",
          maxWidth: "100%",
        }}
      >
        <Box
          component="pre"
          className="embedded-code"
          sx={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowX: "auto",
            display: "block",
            width: "100%",
            maxWidth: "100%",
            overflowWrap: "anywhere",
          }}
        >
          {iframeHtml}
        </Box>

        <CopyButton getText={() => iframeHtml} textBefore="" textAfter="" />
      </Box>
    </Box>
  );
};
