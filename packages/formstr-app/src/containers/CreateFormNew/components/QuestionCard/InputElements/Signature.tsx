import React from "react";
import { Input, Button, Typography, Space } from "antd";
import { IAnswerSettings } from "../../AnswerSettings/types";
import { useTranslation } from "react-i18next";

const { Text, Paragraph } = Typography;

interface SignatureInputProps {
  answerSettings: IAnswerSettings;
}

const SignatureInput: React.FC<SignatureInputProps> = ({ answerSettings }) => {
  const { t } = useTranslation();
  const sig = answerSettings.signature ?? {};

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {sig.editableContent ? (
        // Case 1: Editable content
        <Input.TextArea
          value={sig.prefilledContent}
          placeholder={t("builder.inputPreviews.editContentToSign")}
          rows={4}
          disabled={true}
        />
      ) : sig.prefilledContent ? (
        // Case 2: Prefilled but not editable
        <Paragraph
          style={{
            backgroundColor: "#fafafa",
            border: "1px solid #e0e0e0",
            padding: "8px 12px",
            borderRadius: 6,
            whiteSpace: "pre-wrap",
          }}
        >
          {sig.prefilledContent}
        </Paragraph>
      ) : (
        // Case 3: No prefilled content and not editable
        <Text type="secondary">
          {t("builder.inputPreviews.noContentToSign")}
        </Text>
      )}

      <Button type="primary" onClick={() => {}}>
        {t("builder.inputPreviews.attachSignature")}
      </Button>
    </Space>
  );
};

export default SignatureInput;
