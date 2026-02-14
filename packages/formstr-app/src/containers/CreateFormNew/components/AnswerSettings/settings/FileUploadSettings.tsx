import { Input, InputNumber, Select, Typography, Space, Button, message } from "antd";
import React, { useState, useEffect } from "react";
import { IAnswerSettings } from "../types";
import { SimplePool } from "nostr-tools";

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
    const pool = new SimplePool();

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
        pool.close(PUBLIC_RELAYS);
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
        message.success("Upload endpoint accessible!");
      } else {
        message.warning(`Server responded with status ${response.status}. Upload may not work.`);
      }
    } catch (e: any) {
      console.error("Connection test failed:", e);
      if (e instanceof TypeError || e.message?.includes("Failed to fetch")) {
        message.error("CORS error: This server blocks uploads from this origin. Choose a different server.");
      } else {
        message.error("Failed to connect. Server may be unreachable.");
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "relay":
        return " (from relay)";
      case "custom":
        return " (custom)";
      default:
        return "";
    }
  };

  const commonMimeTypes = [
    { label: "Images (image/*)", value: "image/*" },
    { label: "PDFs (application/pdf)", value: "application/pdf" },
    { label: "Documents (application/msword, .docx)", value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    { label: "Spreadsheets (.xlsx)", value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { label: "Videos (video/*)", value: "video/*" },
    { label: "Audio (audio/*)", value: "audio/*" },
    { label: "Text files (text/*)", value: "text/*" },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <div>
        <Text className="property-name" style={{ display: "block", marginBottom: 8 }}>
          Blossom Server
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
                    + Add custom server
                  </Button>
                ) : (
                  <Space.Compact style={{ width: "100%" }}>
                    <Input
                      placeholder="https://your-server.com"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      onPressEnter={handleAddCustomServer}
                    />
                    <Button onClick={handleAddCustomServer}>Add</Button>
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
        Test Connection
      </Button>

      <div className="property-setting">
        <Text className="property-name">Max File Size (MB)</Text>
        <InputNumber
          min={1}
          max={100}
          value={maxFileSize}
          onChange={(v) => updateSetting("maxFileSize", v || 10)}
        />
      </div>

      <div>
        <Text className="property-name" style={{ display: "block", marginBottom: 8 }}>
          Allowed File Types (optional)
        </Text>
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="Leave empty to allow all types"
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
        Files will be encrypted with NIP-44 before upload
      </Text>
    </Space>
  );
};
