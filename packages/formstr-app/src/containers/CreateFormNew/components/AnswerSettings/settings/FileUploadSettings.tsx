import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { IAnswerSettings } from "../types";
import { fetchMany } from "../../../../../dataLayer";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "../../../../../providers/SnackbarProvider";

const PUBLIC_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
];

export const DEFAULT_SERVERS = [
  "https://nostr.download",
  "https://blossom.oxtr.dev",
];

export interface ServerInfo {
  url: string;
  source: "default" | "relay" | "custom";
}

interface FileUploadSettingsProps {
  answerSettings: IAnswerSettings;
  handleAnswerSettings: (settings: IAnswerSettings) => void;
}

export const FileUploadSettings: React.FC<FileUploadSettingsProps> = ({
  answerSettings,
  handleAnswerSettings,
}) => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const [servers, setServers] = useState<ServerInfo[]>(
    DEFAULT_SERVERS.map((url) => ({ url, source: "default" as const })),
  );
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

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
            // Normalize URL
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
              url = "https://" + url;
            }
            // Remove trailing slash
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

  const updateSetting = (key: string, value: any) => {
    handleAnswerSettings({
      ...answerSettings,
      [key]: value,
    });
  };

  const handleAddCustomServer = () => {
    if (!customUrl.trim()) return;

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

    updateSetting("blossomServer", normalizedUrl);
    setCustomUrl("");
    setShowCustomInput(false);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      // Test the actual upload endpoint that will be used
      const response = await fetch(`${blossomServer}/upload`, {
        method: "OPTIONS", // Check CORS preflight
      });
      if (response.ok || response.status === 204) {
        showMessage(
          t("builder.fileUploadSettings.uploadEndpointAccessible"),
          "success",
        );
      } else {
        showMessage(
          t("builder.fileUploadSettings.uploadEndpointStatus", {
            status: response.status,
          }),
          "warning",
        );
      }
    } catch (e: any) {
      console.error("Connection test failed:", e);
      if (e instanceof TypeError || e.message?.includes("Failed to fetch")) {
        showMessage(
          t("builder.fileUploadSettings.connectionCorsError"),
          "error",
        );
      } else {
        showMessage(t("builder.fileUploadSettings.connectionFailed"), "error");
      }
    } finally {
      setTestingConnection(false);
    }
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

  const commonMimeTypes = [
    {
      label: t("builder.fileUploadSettings.mimeTypes.images"),
      value: "image/*",
    },
    {
      label: t("builder.fileUploadSettings.mimeTypes.pdfs"),
      value: "application/pdf",
    },
    {
      label: t("builder.fileUploadSettings.mimeTypes.documents"),
      value:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    {
      label: t("builder.fileUploadSettings.mimeTypes.spreadsheets"),
      value:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    {
      label: t("builder.fileUploadSettings.mimeTypes.videos"),
      value: "video/*",
    },
    {
      label: t("builder.fileUploadSettings.mimeTypes.audio"),
      value: "audio/*",
    },
    { label: t("builder.fileUploadSettings.mimeTypes.text"), value: "text/*" },
  ];

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}
    >
      <Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: "block", mb: 1 }}
        >
          {t("builder.fileUploadSettings.blossomServer")}
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={blossomServer}
            onChange={(e) => updateSetting("blossomServer", e.target.value)}
            endAdornment={
              loading ? (
                <CircularProgress size={16} sx={{ mr: 3 }} />
              ) : undefined
            }
          >
            {servers.map((server) => (
              <MenuItem key={server.url} value={server.url}>
                {server.url}
                {getSourceLabel(server.source)}
              </MenuItem>
            ))}
            <Divider />
            <Box sx={{ p: 1 }} onKeyDown={(e) => e.stopPropagation()}>
              {!showCustomInput ? (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setShowCustomInput(true)}
                  sx={{ p: 0 }}
                >
                  + {t("builder.fileUploadSettings.addCustomServer")}
                </Button>
              ) : (
                <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="https://your-server.com"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") handleAddCustomServer();
                    }}
                  />
                  <Button variant="outlined" onClick={handleAddCustomServer}>
                    {t("builder.fileUploadSettings.add")}
                  </Button>
                </Box>
              )}
            </Box>
          </Select>
        </FormControl>
      </Box>

      <Button
        variant="outlined"
        fullWidth
        onClick={handleTestConnection}
        disabled={testingConnection}
        startIcon={
          testingConnection ? <CircularProgress size={16} /> : undefined
        }
      >
        {t("builder.fileUploadSettings.testConnection")}
      </Button>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          my: 1.5,
          fontSize: 14,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t("builder.fileUploadSettings.maxFileSize")}
        </Typography>
        <TextField
          type="number"
          size="small"
          value={maxFileSize}
          onChange={(e) =>
            updateSetting("maxFileSize", Number(e.target.value) || 10)
          }
          slotProps={{ htmlInput: { min: 1, max: 100 } }}
          sx={{ width: 100 }}
        />
      </Box>

      <Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: "block", mb: 1 }}
        >
          {t("builder.fileUploadSettings.allowedFileTypes")}
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            multiple
            displayEmpty
            value={allowedTypes}
            onChange={(e) =>
              updateSetting("allowedTypes", e.target.value as string[])
            }
            renderValue={(selected) =>
              selected.length === 0
                ? t("builder.fileUploadSettings.allowAllTypes")
                : selected.join(", ")
            }
          >
            {commonMimeTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block" }}
      >
        {t("builder.fileUploadSettings.filesEncrypted")}
      </Typography>
    </Box>
  );
};
