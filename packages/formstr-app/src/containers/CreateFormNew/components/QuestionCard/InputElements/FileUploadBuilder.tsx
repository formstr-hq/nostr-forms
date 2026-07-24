import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { IAnswerSettings } from "../../AnswerSettings/types";
import {
  DEFAULT_SERVERS,
  ServerInfo,
} from "../../AnswerSettings/settings/FileUploadSettings";
import { fetchMany } from "../../../../../dataLayer";
import { useTranslation } from "react-i18next";

const PUBLIC_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
];

interface FileUploadBuilderProps {
  answerSettings: IAnswerSettings;
  handleAnswerSettings?: (settings: IAnswerSettings) => void;
}

const FileUploadBuilder: React.FC<FileUploadBuilderProps> = ({
  answerSettings,
  handleAnswerSettings,
}) => {
  const { t } = useTranslation();
  const [servers, setServers] = useState<ServerInfo[]>(
    DEFAULT_SERVERS.map((url) => ({ url, source: "default" as const })),
  );
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const blossomServer: string =
    answerSettings.blossomServer || DEFAULT_SERVERS[0];
  const maxFileSize: number = answerSettings.maxFileSize || 10;
  const allowedTypes: string[] = answerSettings.allowedTypes || [];

  useEffect(() => {
    const queryServers = async () => {
      try {
        const events = await fetchMany(
            [{ kinds: [36363], limit: 50 }],
            PUBLIC_RELAYS,
          );

        const relayServers: ServerInfo[] = [];
        const seenUrls = new Set(DEFAULT_SERVERS);

        for (const event of events) {
          const dTag = event.tags.find((t) => t[0] === "d");
          if (dTag && dTag[1]) {
            let url = dTag[1];
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
              url = "https://" + url;
            }
            url = url.replace(/\/$/, "");

            if (!seenUrls.has(url)) {
              seenUrls.add(url);
              relayServers.push({ url, source: "relay" });
            }
          }
        }

        setServers((prev) => [
          ...prev.filter((s) => s.source !== "relay"),
          ...relayServers,
        ]);
      } catch (e) {
        console.error("Failed to query relay servers:", e);
      } finally {
        setLoading(false);
      }
    };

    queryServers();
  }, []);

  const handleAddCustomServer = () => {
    if (!customUrl.trim() || !handleAnswerSettings) return;

    let normalizedUrl = customUrl.trim();
    if (
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://")
    ) {
      normalizedUrl = "https://" + normalizedUrl;
    }
    normalizedUrl = normalizedUrl.replace(/\/$/, "");

    if (!servers.some((s) => s.url === normalizedUrl)) {
      setServers((prev) => [...prev, { url: normalizedUrl, source: "custom" }]);
    }

    handleAnswerSettings({
      ...answerSettings,
      blossomServer: normalizedUrl,
    });
    setCustomUrl("");
    setShowCustomInput(false);
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "relay":
        return t("builder.fileUploadSettings.sourceRelay");
      case "custom":
        return t("builder.fileUploadSettings.sourceCustom");
      default:
        return "";
    }
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}
    >
      {/* Disabled dropzone preview (antd Dragger equivalent) */}
      <Box
        sx={{
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 2,
          backgroundColor: "rgba(0, 0, 0, 0.02)",
          textAlign: "center",
          px: 2,
          py: 3,
          cursor: "not-allowed",
        }}
      >
        <InboxOutlinedIcon sx={{ fontSize: 48, color: "primary.main" }} />
        <Typography variant="body1" sx={{ mt: 1 }}>
          {t("builder.fileUploadSettings.uploadFieldHint")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("builder.fileUploadSettings.uploadFieldBody")}
        </Typography>
      </Box>

      {handleAnswerSettings && (
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            {t("builder.fileUploadSettings.blossomServer")}:
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={blossomServer}
              onChange={(e) =>
                handleAnswerSettings({
                  ...answerSettings,
                  blossomServer: e.target.value,
                })
              }
              renderValue={(value) => value}
              displayEmpty
              endAdornment={
                loading ? (
                  <InputAdornment position="end" sx={{ mr: 3 }}>
                    <CircularProgress size={14} />
                  </InputAdornment>
                ) : undefined
              }
            >
              {servers.map((server) => (
                <MenuItem key={server.url} value={server.url}>
                  {server.url}
                  {getSourceLabel(server.source)}
                </MenuItem>
              ))}
              <Box
                sx={{ p: 1, borderTop: "1px solid", borderColor: "divider" }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {!showCustomInput ? (
                  <Button
                    variant="text"
                    onClick={() => setShowCustomInput(true)}
                    sx={{ p: 0 }}
                    size="small"
                  >
                    + {t("builder.fileUploadSettings.addCustomServer")}
                  </Button>
                ) : (
                  <Box sx={{ display: "flex", width: "100%" }}>
                    <TextField
                      placeholder="https://your-server.com"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") handleAddCustomServer();
                      }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <Button onClick={handleAddCustomServer} size="small">
                      {t("builder.fileUploadSettings.add")}
                    </Button>
                  </Box>
                )}
              </Box>
            </Select>
          </FormControl>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <Typography variant="caption" color="text.secondary">
          {t("builder.fileUploadSettings.maxSize", { size: maxFileSize })}
        </Typography>
        {allowedTypes.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {t("builder.fileUploadSettings.allowedTypes", {
              types: allowedTypes.join(", "),
            })}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {t("builder.fileUploadSettings.encryptionHint")}
        </Typography>
      </Box>
    </Box>
  );
};

export default FileUploadBuilder;
