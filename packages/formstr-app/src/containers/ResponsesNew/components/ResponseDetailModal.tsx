import React, { useState, useEffect } from "react";
import { Modal, Typography, Button, Space, Form } from "antd";
import { Event, nip19, getPublicKey } from "nostr-tools";
import { hexToBytes } from "nostr-tools/utils";
import { Tag } from "../../../nostr/types";
import { FormRenderer } from "../../FormFillerNew/FormRenderer";
import { buildResponseFormValues } from "../../../utils/ResponseUtils";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

type ResponseDetailItem = {
  key: string;
  question: string;
  answer: string;
};
interface ResponseDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  formSpec: Tag[];
  processedInputs: Tag[];
  responseMetadataEvent: Event | null;
  formstrBranding?: boolean;
  editKey?: string | null;
}
export const ResponseDetailModal: React.FC<ResponseDetailModalProps> = ({
  isVisible,
  onClose,
  formSpec,
  processedInputs,
  responseMetadataEvent,
  formstrBranding,
  editKey,
}) => {
  const { t } = useTranslation();
  const [metaData, setMetaData] = useState<{
    author?: string;
    timestamp?: string;
  }>({});
  const [form] = Form.useForm();

  useEffect(() => {
    if (isVisible && responseMetadataEvent) {
      const authorNpub = nip19.npubEncode(responseMetadataEvent.pubkey);
      const timestamp = new Date(
        responseMetadataEvent.created_at * 1000
      ).toLocaleString();
      setMetaData({ author: authorNpub, timestamp });
      if (processedInputs && processedInputs.length > 0) {
        form.setFieldsValue(buildResponseFormValues(processedInputs));
      } else {
        form.resetFields();
      }
    } else {
      setMetaData({});
      form.resetFields();
    }
  }, [isVisible, responseMetadataEvent, processedInputs, formSpec]);

  return (
    <Modal
      title={
        <Space direction="vertical" size="small">
          <Text strong>{t("responses.detail.title")}</Text>
          <Text type="secondary" style={{ fontSize: "0.9em" }}>
            {t("responses.detail.by")}:{" "}
            <Typography.Link
              href={`https://njump.me/${metaData.author}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {metaData.author || t("responses.detail.unknownAuthor")}
            </Typography.Link>
          </Text>
          <Text type="secondary" style={{ fontSize: "0.8em" }}>
            {t("responses.detail.submitted")}:{" "}
            {metaData.timestamp || t("responses.detail.unavailable")}
          </Text>
        </Space>
      }
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t("common.actions.close")}
        </Button>,
      ]}
      width={900}
      destroyOnClose={true}
    >
      {formSpec && formSpec.length > 0 ? (
        <FormRenderer
          formTemplate={formSpec}
          form={form}
          onInput={() => {}}
          disabled={true}
          readOnly={true}
          initialValues={buildResponseFormValues(processedInputs)}
          formstrBranding={formstrBranding}
          formAuthorPubkey={editKey ? getPublicKey(hexToBytes(editKey)) : undefined}
          formEditKey={editKey || undefined}
          uploaderPubkey={responseMetadataEvent?.pubkey}
        />
      ) : (
        <Typography.Text>{t("responses.detail.waiting")}</Typography.Text>
      )}
    </Modal>
  );
};
