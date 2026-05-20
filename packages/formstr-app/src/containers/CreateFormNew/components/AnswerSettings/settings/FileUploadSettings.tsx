import { Input, InputNumber, Select, Typography, Space, Button, message } from "antd";
import React, { useState, useEffect } from "react";
import { IAnswerSettings } from "../types";
import { pool } from "../../../../../pool";
import { useTranslation } from "react-i18next";

const { Text } = Typography;
const { Option } = Select;

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
  const [servers, setServers] = useState<ServerInfo[]>(
    DEFAULT_SERVERS.map((url) => ({ url, source: "default" as const }))
  );
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const blossomServer: string = answerSettings.blossomServer || DEFAULT_SERVERS[0];
  const maxFileSize: number = answerSettings.maxFileSize || 10;
  const allowedTypes: string[] = answerSettings.allowedTypes || [];

  useEffect(() => {
    const queryServers = async () => {
      try {
        const events = await pool.querySync(PUBLIC_RELAYS, {
          kinds: [36363],
          limit: 50,
        });

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
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
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
        message.success(t("builder.fileUploadSettings.uploadEndpointAccessible"));
      } else {
        message.warning(
          t("builder.fileUploadSettings.uploadEndpointStatus", {
            status: response.status,
          }),
        );
      }
    } catch (e: any) {
      console.error("Connection test failed:", e);
      if (e instanceof TypeError || e.message?.includes("Failed to fetch")) {
        message.error(t("builder.fileUploadSettings.connectionCorsError"));
      } else {
        message.error(t("builder.fileUploadSettings.connectionFailed"));
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
    { label: t("builder.fileUploadSettings.mimeTypes.images"), value: "image/*" },
    { label: t("builder.fileUploadSettings.mimeTypes.pdfs"), value: "application/pdf" },
    { label: t("builder.fileUploadSettings.mimeTypes.documents"), value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    { label: t("builder.fileUploadSettings.mimeTypes.spreadsheets"), value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { label: t("builder.fileUploadSettings.mimeTypes.videos"), value: "video/*" },
    { label: t("builder.fileUploadSettings.mimeTypes.audio"), value: "audio/*" },
    { label: t("builder.fileUploadSettings.mimeTypes.text"), value: "text/*" },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <div>
        <Text className="property-name" style={{ display: "block", marginBottom: 8 }}>
          {t("builder.fileUploadSettings.blossomServer")}
        </Text>
        <Select
          style={{ width: "100%" }}
          value={blossomServer}
          onChange={(value) => updateSetting("blossomServer", value)}
          loading={loading}
          dropdownRender={(menu) => (
            <>
              {menu}
              <div style={{ padding: "8px", borderTop: "1px solid #f0f0f0" }}>
                {!showCustomInput ? (
                  <Button
                    type="link"
                    onClick={() => setShowCustomInput(true)}
                    style={{ padding: 0 }}
                  >
                    + {t("builder.fileUploadSettings.addCustomServer")}
                  </Button>
                ) : (
                  <Space.Compact style={{ width: "100%" }}>
                    <Input
                      placeholder="https://your-server.com"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      onPressEnter={handleAddCustomServer}
                    />
                    <Button onClick={handleAddCustomServer}>
                      {t("builder.fileUploadSettings.add")}
                    </Button>
                  </Space.Compact>
                )}
              </div>
            </>
          )}
        >
          {servers.map((server) => (
            <Option key={server.url} value={server.url}>
              {server.url}
              {getSourceLabel(server.source)}
            </Option>
          ))}
        </Select>
      </div>

      <Button
        onClick={handleTestConnection}
        loading={testingConnection}
        style={{ width: "100%" }}
      >
        {t("builder.fileUploadSettings.testConnection")}
      </Button>

      <div className="property-setting">
        <Text className="property-name">
          {t("builder.fileUploadSettings.maxFileSize")}
        </Text>
        <InputNumber
          min={1}
          max={100}
          value={maxFileSize}
          onChange={(v) => updateSetting("maxFileSize", v || 10)}
        />
      </div>

      <div>
        <Text className="property-name" style={{ display: "block", marginBottom: 8 }}>
          {t("builder.fileUploadSettings.allowedFileTypes")}
        </Text>
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder={t("builder.fileUploadSettings.allowAllTypes")}
          value={allowedTypes}
          onChange={(v) => updateSetting("allowedTypes", v)}
        >
          {commonMimeTypes.map((type) => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
      </div>

      <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
        {t("builder.fileUploadSettings.filesEncrypted")}
      </Text>
    </Space>
  );
};
