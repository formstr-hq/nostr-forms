import React, { useState } from "react";
import { Modal, Button, Typography, Space, Input, message, Alert } from "antd";
import { ImportOutlined, LinkOutlined } from "@ant-design/icons";
import { Event } from "nostr-tools";
import { useTranslation } from "react-i18next";
import { parseFormUrl, ParsedFormUrl } from "../../utils/formUrlParser";
import { fetchFormTemplate } from "../../nostr/fetchFormTemplate";
import { ILocalForm } from "../../containers/CreateFormNew/providers/FormBuilder/typeDefs";
import { useLocalForms } from "../../provider/LocalFormsProvider";
import { getDefaultRelays } from "../../nostr/common";

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
  const { t } = useTranslation();
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<FormPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(t("import.enterUrl"));
      return;
    }

    const parsed = parseFormUrl(trimmedUrl);
    if (!parsed) {
      setError(t("import.invalidUrl"));
      return;
    }

    if (!parsed.secretKey) {
      setError(t("import.requiresEditAccess"));
      return;
    }

    // Check if already imported
    const formKey = `${parsed.pubkey}:${parsed.formId}`;
    if (localForms.some((f) => f.key === formKey)) {
      setError(t("import.alreadyImported"));
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
        setError(t("import.notFound"));
        setLoading(false);
        return;
      }

      // Extract form name from tags
      const nameTag = formEvent.tags.find((t) => t[0] === "name");
      const formName = nameTag?.[1] || t("common.status.untitledForm");

      setPreview({
        parsed,
        formName,
        formEvent,
      });
    } catch (e) {
      console.error("Error fetching form:", e);
      setError(t("import.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    const { parsed, formName } = preview;
    const relays =
      parsed.relays.length > 0 ? parsed.relays : getDefaultRelays();

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
      message.success(t("import.importSuccess"));
      handleClose();
      onImported();
    } catch (e) {
      message.error(t("import.importFailed"));
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
          {t("import.title")}
        </Title>
        <Text type="secondary">
          {t("import.subtitle")}
        </Text>
      </div>

      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Input.TextArea
          placeholder={t("import.placeholder")}
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
            {loading ? t("import.fetching") : t("import.parse")}
          </Button>
        )}

        {preview && (
          <>
            <Alert
              message={t("import.formFound")}
              description={
                <div style={{ marginTop: 8 }}>
                  <p>
                    <strong>{t("import.labels.name")}:</strong> {preview.formName}
                  </p>
                  <p>
                    <strong>{t("import.labels.formId")}:</strong> {preview.parsed.formId}
                  </p>
                  <p>
                    <strong>{t("import.labels.author")}:</strong>{" "}
                    {truncatePubkey(preview.parsed.pubkey)}
                  </p>
                  <p>
                    <strong>{t("import.labels.relays")}:</strong>{" "}
                    {preview.parsed.relays.length > 0
                      ? preview.parsed.relays.length
                      : 1}{" "}
                    {t("import.relayCount", {
                      count: preview.parsed.relays.length > 0
                        ? preview.parsed.relays.length
                        : 1,
                    })}
                  </p>
                  {preview.parsed.viewKey && (
                    <p>
                      <strong>{t("import.labels.viewKey")}:</strong>{" "}
                      {t("import.included")}
                    </p>
                  )}
                  <p>
                    <strong>{t("import.labels.editAccess")}:</strong>{" "}
                    {t("import.editAccessIncluded")}
                  </p>
                </div>
              }
              type="success"
              showIcon
            />

            <Alert
              message={t("import.editAccessNoticeTitle")}
              description={t("import.editAccessNoticeBody")}
              type="info"
              showIcon
            />

            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={resetState}>{t("common.actions.cancel")}</Button>
              <Button type="primary" onClick={handleImport}>
                {t("import.title")}
              </Button>
            </Space>
          </>
        )}
      </Space>
    </Modal>
  );
};

export default ImportFormModal;
