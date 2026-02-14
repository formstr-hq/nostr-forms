import React, { useState, useEffect } from "react";
import { Modal, Descriptions, Typography, Button, Space, Form } from "antd";
import { Event, nip19, getPublicKey } from "nostr-tools";
import { hexToBytes } from "nostr-tools/utils";
import { Tag } from "../../../nostr/types";
import {
  getResponseLabels,
  DisplayableAnswerDetail,
} from "../../../utils/ResponseUtils";
import { FormRenderer } from "../../FormFillerNew/FormRenderer";

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
  const [metaData, setMetaData] = useState<{
    author?: string;
    timestamp?: string;
  }>({});
  const [form] = Form.useForm();

  const buildInitialValues = (inputs: Tag[]) => {
    const values: Record<string, any> = {};
    if (!inputs) return values;
    for (const tag of inputs) {
      if (Array.isArray(tag) && tag[0] === "response") {
        const [, fieldId, answer, metadata] = tag;
        let message = "";
        try {
          message = JSON.parse(metadata || "{}").message || "";
        } catch {}
        values[fieldId] = [answer, message];
      }
    }
    return values;
  };

  useEffect(() => {
    if (isVisible && responseMetadataEvent) {
      const authorNpub = nip19.npubEncode(responseMetadataEvent.pubkey);
      const timestamp = new Date(
        responseMetadataEvent.created_at * 1000
      ).toLocaleString();
      setMetaData({ author: authorNpub, timestamp });
      if (processedInputs && processedInputs.length > 0) {
        form.setFieldsValue(buildInitialValues(processedInputs));
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
          <Text strong>Response Details</Text>
          <Text type="secondary" style={{ fontSize: "0.9em" }}>
            By:{" "}
            <Typography.Link
              href={`https://njump.me/${metaData.author}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {metaData.author || "Unknown"}
            </Typography.Link>
          </Text>
          <Text type="secondary" style={{ fontSize: "0.8em" }}>
            Submitted: {metaData.timestamp || "N/A"}
          </Text>
        </Space>
      }
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
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
          initialValues={buildInitialValues(processedInputs)}
          formstrBranding={formstrBranding}
          formAuthorPubkey={editKey ? getPublicKey(hexToBytes(editKey)) : undefined}
          formEditKey={editKey || undefined}
          uploaderPubkey={responseMetadataEvent?.pubkey}
        />
      ) : (
        <Typography.Text>
          Waiting for form details or response data...
        </Typography.Text>
      )}
    </Modal>
  );
};
