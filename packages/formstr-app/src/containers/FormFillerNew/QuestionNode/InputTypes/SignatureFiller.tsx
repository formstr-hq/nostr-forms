import { Button, Input, Typography, Collapse } from "antd";
import { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import { IAnswerSettings } from "../../../CreateFormNew/components/AnswerSettings/types";
import { Field } from "../../../../nostr/types";
import { signerManager } from "../../../../signer";
import { DatePicker } from "antd";

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
      alert("Signature failed");
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
                <Text style={{ margin: 10 }}> Signature Date: </Text>
                <DatePicker
                  value={createdAt}
                  onChange={(date) => date && setCreatedAt(date)}
                  showTime
                  style={{ marginBottom: 8, width: "auto" }}
                  disabled={disabled}
                  placeholder="Pick Date & Time"
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
            {isSigning ? "Signing..." : "Attach Signature"}
          </Button>
        </>
      )}

      {hasExistingSignature && (
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            ✓ Signature Attached
          </Text>
          {existingSignature.content && (
            <div
              style={{
                backgroundColor: "var(--app-color-border-soft)",
                padding: "12px",
                borderRadius: 4,
                marginBottom: 8,
                whiteSpace: "pre-wrap",
              }}
            >
              <Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: 4 }}>
                Signed Content:
              </Text>
              <Text>{existingSignature.content}</Text>
            </div>
          )}
          {existingSignature.created_at && (
            <Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: 8 }}>
              Signed on: {dayjs(existingSignature.created_at * 1000).format("YYYY-MM-DD HH:mm:ss")}
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
              label: <Text strong>View Signed Event</Text>,
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
