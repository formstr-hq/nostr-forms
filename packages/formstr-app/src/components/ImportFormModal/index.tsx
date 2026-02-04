import React, { useState } from "react";
import { Modal, Button, Typography, Space, Input, message, Alert } from "antd";
import { ImportOutlined, LinkOutlined } from "@ant-design/icons";
import { Event } from "nostr-tools";
import { parseFormUrl, ParsedFormUrl } from "../../utils/formUrlParser";
import { fetchFormTemplate } from "../../nostr/fetchFormTemplate";
import { useApplicationContext } from "../../hooks/useApplicationContext";
import { ILocalForm } from "../../containers/CreateFormNew/providers/FormBuilder/typeDefs";
import { useLocalForms } from "../../provider/LocalFormsProvider";

const { Title, Text } = Typography;

interface ImportFormModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

interface FormPreview {
  parsed: ParsedFormUrl;
  formName: string;
  formEvent: Event;
}

const ImportFormModal: React.FC<ImportFormModalProps> = ({
  open,
  onClose,
  onImported,
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<FormPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { poolRef } = useApplicationContext();
  const { localForms, saveLocalForm } = useLocalForms();

  const resetState = () => {
    setUrlInput("");
    setPreview(null);
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleParseUrl = async () => {
    setError(null);
    setPreview(null);

    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) {
      setError("Please enter a form URL");
      return;
    }

    const parsed = parseFormUrl(trimmedUrl);
    if (!parsed) {
      setError("Invalid form URL. Please enter a valid Formstr link.");
      return;
    }

    if (!parsed.secretKey) {
      setError(
        "This link doesn't contain edit access (secret key). " +
          "Only forms with edit access can be imported. " +
          "You can bookmark view-only links instead.",
      );
      return;
    }

    // Check if already imported
    const formKey = `${parsed.pubkey}:${parsed.formId}`;
    if (localForms.some((f) => f.key === formKey)) {
      setError("This form is already in your local forms list.");
      return;
    }

    // Fetch form to get name and validate it exists
    setLoading(true);
    try {
      const formEvent = await new Promise<Event | null>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        }, 10000);

        fetchFormTemplate(
          parsed.pubkey,
          parsed.formId,
          poolRef.current,
          (event: Event) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(event);
            }
          },
          parsed.relays.length > 0 ? parsed.relays : undefined,
        );
      });

      if (!formEvent) {
        setError("Form not found on relays. The form may have been deleted.");
        setLoading(false);
        return;
      }

      // Extract form name from tags
      const nameTag = formEvent.tags.find((t) => t[0] === "name");
      const formName = nameTag?.[1] || "Untitled Form";

      setPreview({
        parsed,
        formName,
        formEvent,
      });
    } catch (e) {
      console.error("Error fetching form:", e);
      setError("Failed to fetch form from relays. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    const { parsed, formName } = preview;
    const relays =
      parsed.relays.length > 0 ? parsed.relays : ["wss://relay.damus.io"];

    const formToSave: ILocalForm = {
      key: `${parsed.pubkey}:${parsed.formId}`,
      publicKey: parsed.pubkey,
      privateKey: parsed.secretKey!,
      name: formName,
      formId: parsed.formId,
      relay: relays[0],
      relays: relays,
      createdAt: new Date().toString(),
      ...(parsed.viewKey && { viewKey: parsed.viewKey }),
    };

    try {
      await saveLocalForm(formToSave);
      message.success("Form imported successfully!");
      handleClose();
      onImported();
    } catch (e) {
      message.error("Failed to import form. Please try again.");
    }
  };

  const truncatePubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={480}
      destroyOnClose
    >
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <Title level={4}>
          <ImportOutlined style={{ marginRight: 8 }} />
          Import Form
        </Title>
        <Text type="secondary">
          Paste a form response link to add it to your local forms
        </Text>
      </div>

      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Input.TextArea
          placeholder="Paste form URL here (e.g., https://formstr.app/s/naddr1...#nkeys1...)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled={loading || !!preview}
        />

        {error && <Alert message={error} type="error" showIcon />}

        {!preview && (
          <Button
            type="primary"
            icon={<LinkOutlined />}
            onClick={handleParseUrl}
            loading={loading}
            block
          >
            {loading ? "Fetching form..." : "Parse URL"}
          </Button>
        )}

        {preview && (
          <>
            <Alert
              message="Form found!"
              description={
                <div style={{ marginTop: 8 }}>
                  <p>
                    <strong>Name:</strong> {preview.formName}
                  </p>
                  <p>
                    <strong>Form ID:</strong> {preview.parsed.formId}
                  </p>
                  <p>
                    <strong>Author:</strong>{" "}
                    {truncatePubkey(preview.parsed.pubkey)}
                  </p>
                  <p>
                    <strong>Relays:</strong>{" "}
                    {preview.parsed.relays.length > 0
                      ? preview.parsed.relays.length
                      : 1}{" "}
                    relay(s)
                  </p>
                  {preview.parsed.viewKey && (
                    <p>
                      <strong>View Key:</strong> Included
                    </p>
                  )}
                  <p>
                    <strong>Edit Access:</strong> Yes (secret key included)
                  </p>
                </div>
              }
              type="success"
              showIcon
            />

            <Alert
              message="This link contains edit access"
              description="You'll be able to edit the form and view responses."
              type="info"
              showIcon
            />

            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={resetState}>Cancel</Button>
              <Button type="primary" onClick={handleImport}>
                Import Form
              </Button>
            </Space>
          </>
        )}
      </Space>
    </Modal>
  );
};

export default ImportFormModal;
