import { Button, Input, Typography, Collapse } from "antd";
import { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import { IAnswerSettings } from "../../../CreateFormNew/components/AnswerSettings/types";
import { Field } from "../../../../nostr/types";
import { signerManager } from "../../../../signer";
import { DatePicker } from "antd";
import { useTranslation } from "react-i18next";

const { TextArea } = Input;
const { Text } = Typography;

interface SignatureFillerProps {
  fieldConfig: IAnswerSettings;
  onChange: (value: string, displayValue?: string) => void;
  field?: Field;
  disabled?: boolean;
  defaultValue?: string;
}

export const SignatureFiller: React.FC<SignatureFillerProps> = ({
  fieldConfig,
  onChange,
  disabled,
  defaultValue,
}) => {
  const { t } = useTranslation();
  const sig = fieldConfig.signature || {};
  
  const parseExistingSignature = (value: string | undefined) => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && parsed.content !== undefined) {
        return parsed;
      }
    } catch (e) {
      return null;
    }
  };

  const existingSignature = parseExistingSignature(defaultValue);
  
  const [content, setContent] = useState(
    existingSignature?.content || sig.prefilledContent || ""
  );
  const [signedEvent, setSignedEvent] = useState<string | null>(
    defaultValue || null
  );
  const [isSigning, setIsSigning] = useState(false);


  const getInitialCreatedAt = (): Dayjs => {
    if (existingSignature?.created_at) {
      return dayjs(existingSignature.created_at * 1000);
    }
    return dayjs(Date.now());
  };
  const [createdAt, setCreatedAt] = useState<Dayjs>(getInitialCreatedAt());

  useEffect(() => {
    const parsed = parseExistingSignature(defaultValue);
    if (parsed) {
      setSignedEvent(defaultValue || null);
      setContent(parsed.content || sig.prefilledContent || "");
      if (parsed.created_at) {
        setCreatedAt(dayjs(parsed.created_at * 1000));
      }
    } else if (!defaultValue) {
      setSignedEvent(null);
      setContent(sig.prefilledContent || "");
      setCreatedAt(dayjs(Date.now()));
    }
  }, [defaultValue, sig.prefilledContent]);

  const handleSign = async () => {
    const event = {
      kind: sig.kind || 22157,
      created_at: sig.editableCreatedAt
        ? Math.floor(createdAt.valueOf() / 1000)
        : Math.floor(Date.now() / 1000),
      content,
      tags: [],
    };

    try {
      setIsSigning(true);
      const signer = await signerManager.getSigner();
      const signed = await signer.signEvent(event);
      const signedString = JSON.stringify(signed, null, 2);
      setSignedEvent(signedString);
      onChange(signedString, "Signed nostr event");
    } catch (e) {
      console.error(e);
      alert(t("filler.inputs.signatureFailed"));
    } finally {
      setIsSigning(false);
    }
  };

  const hasExistingSignature = !!existingSignature;

  return (
    <div style={{ height: "auto" }}>
      {!hasExistingSignature && (
        <>
          <TextArea
            value={content}
            disabled={disabled || !sig.editableContent}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <div style={{ display: "flex" }}>
            {sig.editableCreatedAt && (
              <>
                <Text style={{ margin: 10 }}>
                  {t("filler.inputs.signatureDate")}:
                </Text>
                <DatePicker
                  value={createdAt}
                  onChange={(date) => date && setCreatedAt(date)}
                  showTime
                  style={{ marginBottom: 8, width: "auto" }}
                  disabled={disabled}
                  placeholder={t("filler.inputs.pickDateTime")}
                />
              </>
            )}
          </div>
          <Button
            type="primary"
            loading={isSigning}
            onClick={handleSign}
            disabled={disabled}
            style={{ marginTop: 8 }}
          >
            {isSigning
              ? t("filler.inputs.signing")
              : t("filler.inputs.attachSignature")}
          </Button>
        </>
      )}

      {hasExistingSignature && (
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            {`\u2713 ${t("filler.inputs.signatureAttached")}`}
          </Text>
          {existingSignature.content && (
            <div
              style={{
                backgroundColor: "#f0f0f0",
                padding: "12px",
                borderRadius: 4,
                marginBottom: 8,
                whiteSpace: "pre-wrap",
              }}
            >
              <Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: 4 }}>
                {t("filler.inputs.signedContent")}:
              </Text>
              <Text>{existingSignature.content}</Text>
            </div>
          )}
          {existingSignature.created_at && (
            <Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: 8 }}>
              {t("filler.inputs.signedOn")}:{" "}
              {dayjs(existingSignature.created_at * 1000).format("YYYY-MM-DD HH:mm:ss")}
            </Text>
          )}
        </div>
      )}

      {signedEvent && (
        <Collapse
          ghost
          style={{ marginTop: 12 }}
          items={[
            {
              key: "1",
              label: <Text strong>{t("filler.inputs.viewSignedEvent")}</Text>,
              children: (
                <TextArea
                  value={signedEvent}
                  autoSize={{ minRows: 6, maxRows: 12 }}
                  readOnly
                  style={{
                    fontFamily: "monospace",
                    background: "#fafafa",
                    borderRadius: 4,
                  }}
                />
              ),
            },
          ]}
        />
      )}
    </div>
  );
};
