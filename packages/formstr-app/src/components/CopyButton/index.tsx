import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import { Box, IconButton, Typography } from "@mui/material";
import { useState } from "react";

export const CopyButton = ({
  getText,
  textBefore,
  textAfter,
}: {
  getText: () => string;
  textBefore?: string;
  textAfter?: string;
}) => {
  const [copyMessage, setCopyMessage] = useState<
    "Copy" | "Copied!" | "Error!" | string
  >(textBefore === undefined ? "Copy" : textBefore);
  const copyText = () => {
    navigator.clipboard.writeText(getText()).then(
      (resolve) => {
        setCopyMessage(textAfter === undefined ? "Copied!" : textAfter);
      },
      (reject) => {
        setCopyMessage("Error!");
      },
    );
    setTimeout(() => {
      setCopyMessage(textBefore === undefined ? "Copy" : textBefore);
    }, 5000);
  };
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography variant="body2">{copyMessage}</Typography>
      <IconButton
        aria-label="copy"
        disabled={copyMessage === "Copied!"}
        onClick={copyText}
        size="small"
      >
        {copyMessage === "Copied!" ? (
          <CheckCircleOutlineOutlinedIcon fontSize="small" />
        ) : (
          <ContentCopyOutlinedIcon fontSize="small" />
        )}
      </IconButton>
    </Box>
  );
};
