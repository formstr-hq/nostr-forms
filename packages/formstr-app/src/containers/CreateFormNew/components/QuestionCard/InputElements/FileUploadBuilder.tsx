import React, { useState, useEffect } from "react";
import { Upload, Typography, Space, Select, Input, Button } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { IAnswerSettings } from "../../AnswerSettings/types";
import { DEFAULT_SERVERS, ServerInfo } from "../../AnswerSettings/settings/FileUploadSettings";
import { pool } from "../../../../../pool";

const { Text } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

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
  handleAnswerSettings
}) => {
  const [servers, setServers] = useState<ServerInfo[]>(
    DEFAULT_SERVERS.map((url) => ({ url, source: "default" as const }))
  );
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

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
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
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
        return " (from relay)";
      case "custom":
        return " (custom)";
      default:
        return "";
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Dragger disabled={true} style={{ cursor: "not-allowed" }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">File upload field (users will upload here)</p>
        <p className="ant-upload-hint">
          Files will be encrypted and uploaded to Blossom server
        </p>
      </Dragger>

      {handleAnswerSettings && (
        <div>
          <Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: 4 }}>
            Blossom Server:
          </Text>
          <Select
            style={{ width: "100%" }}
            value={blossomServer}
            onChange={(value) => handleAnswerSettings({ ...answerSettings, blossomServer: value })}
            loading={loading}
            size="small"
            dropdownRender={(menu) => (
              <>
                {menu}
                <div style={{ padding: "8px", borderTop: "1px solid #f0f0f0" }}>
                  {!showCustomInput ? (
                    <Button
                      type="link"
                      onClick={() => setShowCustomInput(true)}
                      style={{ padding: 0 }}
                      size="small"
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
                        size="small"
                      />
                      <Button onClick={handleAddCustomServer} size="small">Add</Button>
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
      )}

      <Space direction="vertical" size={0} style={{ width: "100%" }}>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Max size: {maxFileSize} MB
        </Text>
        {allowedTypes.length > 0 && (
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Allowed types: {allowedTypes.join(", ")}
          </Text>
        )}
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Encryption: NIP-44 (always enabled)
        </Text>
      </Space>
    </Space>
  );
};

export default FileUploadBuilder;
