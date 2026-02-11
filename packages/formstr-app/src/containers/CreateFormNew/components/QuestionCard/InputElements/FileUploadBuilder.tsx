import React from "react";
import { Upload, Typography, Space } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { IAnswerSettings } from "../../AnswerSettings/types";

const { Text } = Typography;
const { Dragger } = Upload;

interface FileUploadBuilderProps {
  answerSettings: IAnswerSettings;
}

const FileUploadBuilder: React.FC<FileUploadBuilderProps> = ({ answerSettings }) => {
  const blossomServer: string = answerSettings.blossomServer || "Not configured";
  const maxFileSize: number = answerSettings.maxFileSize || 10;
  const allowedTypes: string[] = answerSettings.allowedTypes || [];

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Dragger disabled={true} style={{ cursor: "not-allowed" }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">File upload field (users will upload here)</p>
        <p className="ant-upload-hint">
          Files will be encrypted and uploaded to Blossom server
        </p>
      </Dragger>

      <Space direction="vertical" size={0} style={{ width: "100%" }}>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Server: {blossomServer}
        </Text>
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
