// EmbedTab.tsx
import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
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
      sx={{ display: "flex", flexDirection: "column", width: "100%" }}
    >
      <Box
        className="settings-container"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
          mb: 1,
        }}
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
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            py: 0.25,
            bgcolor: "background.default",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            HTML
          </Typography>
          <CopyButton getText={() => iframeHtml} />
        </Box>
        <Box
          component="pre"
          className="embedded-code"
          sx={{
            m: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            fontSize: 12,
            bgcolor: "#0f172a",
            color: "#e5e7eb",
            p: "1rem",
            textAlign: "left",
          }}
        >
          {iframeHtml}
        </Box>
      </Box>
    </Box>
  );
};
