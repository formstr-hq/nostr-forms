import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { useState } from "react";
import { isMobile } from "../../../../utils/utility";
import { useTranslation } from "react-i18next";

export const UrlBox = ({
  label,
  url,
  showFullUrl = false,
  maxWidth = 400, // optional fixed width
  warning,
}: {
  label: string;
  url: string;
  showFullUrl?: boolean;
  maxWidth?: number;
  warning?: string;
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontWeight: 600, mb: 0.5, textAlign: "left" }}>
        {label}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title={url}>
          <Box
            sx={{
              bgcolor: "grey.100",
              p: "8px 12px",
              borderRadius: 2,
              width: isMobile() ? 200 : 400,
              minWidth: 0, // lets flexbox shrink
              overflow: "hidden",
              whiteSpace: showFullUrl ? "normal" : "nowrap",
              textOverflow: showFullUrl ? "clip" : "ellipsis",
              flex: 1,
              textAlign: "left",
            }}
          >
            <Box
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-block",
                maxWidth: "100%",
                textOverflow: showFullUrl ? "clip" : "ellipsis",
                whiteSpace: showFullUrl ? "normal" : "nowrap",
              }}
            >
              {url}
            </Box>
            {warning && (
              <Typography
                variant="body2"
                sx={{
                  mt: 0.75,
                  fontSize: 12,
                  color: "#b45309",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                ⚠️ {warning}
              </Typography>
            )}
          </Box>
        </Tooltip>

        {/* Buttons beside the URL box */}
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title={t("common.actions.copy")}>
            <IconButton
              aria-label={t("common.actions.copy")}
              onClick={handleCopy}
              size="small"
            >
              <ContentCopyOutlinedIcon fontSize="small" />
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
      </Box>

      {copied && (
        <Typography variant="body2" sx={{ mt: 0.5, textAlign: "left" }}>
          {t("builder.formDetails.urlBox.copied")} {"✅"}
        </Typography>
      )}
    </Box>
  );
};
