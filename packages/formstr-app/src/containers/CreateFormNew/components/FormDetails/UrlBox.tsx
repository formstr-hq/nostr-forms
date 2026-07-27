import { Alert, Box, IconButton, Tooltip, Typography } from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const UrlBox = ({
  label,
  url,
  showFullUrl = false,
  warning,
}: {
  label: string;
  url: string;
  showFullUrl?: boolean;
  /** kept for API compatibility; layout is now fluid */
  maxWidth?: number;
  warning?: string;
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 600, mb: 0.75, textAlign: "left" }}
      >
        {label}
      </Typography>

      {/* One self-contained field: the URL and its actions share a single
          bordered surface so the icons always align with the box edge. */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.default",
          pl: 1.5,
          pr: 0.5,
          py: 0.25,
        }}
      >
        <Tooltip title={url}>
          <Box
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              flex: 1,
              minWidth: 0,
              textAlign: "left",
              color: "primary.main",
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: showFullUrl ? "clip" : "ellipsis",
              whiteSpace: showFullUrl ? "normal" : "nowrap",
              wordBreak: showFullUrl ? "break-all" : "normal",
              fontSize: 14,
              ":hover": { textDecoration: "underline" },
            }}
          >
            {url}
          </Box>
        </Tooltip>

        <Tooltip
          title={copied ? t("builder.formDetails.urlBox.copied") : t("common.actions.copy")}
        >
          <IconButton
            aria-label={t("common.actions.copy")}
            onClick={handleCopy}
            size="small"
          >
            {copied ? (
              <CheckOutlinedIcon fontSize="small" color="success" />
            ) : (
              <ContentCopyOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title={t("builder.formDetails.urlBox.openInNewTab")}>
          <IconButton
            aria-label={t("builder.formDetails.urlBox.openInNewTab")}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
          >
            <OpenInNewOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {warning && (
        <Alert
          severity="warning"
          sx={{
            mt: 1,
            py: 0,
            fontSize: 12,
            textAlign: "left",
            alignItems: "center",
            "& .MuiAlert-message": { py: 0.75 },
          }}
        >
          {warning}
        </Alert>
      )}
    </Box>
  );
};
