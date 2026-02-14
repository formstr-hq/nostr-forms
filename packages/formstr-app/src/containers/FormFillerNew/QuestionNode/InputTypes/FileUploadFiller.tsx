import { Upload, Button, Typography, message, Steps, Space } from "antd";
import { UploadOutlined, CheckCircleOutlined, InboxOutlined, DownloadOutlined, FileOutlined, LockOutlined, SafetyCertificateOutlined, CloudUploadOutlined, CloudDownloadOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { IAnswerSettings } from "../../../CreateFormNew/components/AnswerSettings/types";
import { Field, FileUploadMetadata } from "../../../../nostr/types";
import { BlossomClient } from "../../../../utils/blossom";
import { createAuthEvent } from "../../../../utils/blossomAuth";
import { encryptFileToAuthor, decryptFileFromUploader } from "../../../../utils/blossomCrypto";
import type { RcFile } from "antd/es/upload/interface";
import { hexToBytes } from "nostr-tools/utils";
import { DEFAULT_SERVERS } from "../../../CreateFormNew/components/AnswerSettings/settings/FileUploadSettings";

const { Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface FileUploadFillerProps {
  fieldConfig: IAnswerSettings;
  onChange: (value: string, displayValue?: string) => void;
  field?: Field;
  disabled?: boolean;
  defaultValue?: string;
  formAuthorPubkey?: string;
  formEditKey?: string;
  responderSecretKey: Uint8Array; // Required - always used for file encryption (signers can't handle large files)
  uploaderPubkey?: string; // For decryption when viewing responses
}

export const FileUploadFiller: React.FC<FileUploadFillerProps> = ({
  fieldConfig,
  onChange,
  disabled,
  defaultValue,
  formAuthorPubkey,
  formEditKey,
  responderSecretKey,
  uploaderPubkey,
}) => {
  const blossomServer: string = fieldConfig.blossomServer || DEFAULT_SERVERS[0];
  const maxFileSize: number = (fieldConfig.maxFileSize || 10) * 1024 * 1024; // Convert MB to bytes
  const allowedTypes: string[] = fieldConfig.allowedTypes || [];

  const parseExistingMetadata = (value: string | undefined): FileUploadMetadata | null => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && parsed.sha256) {
        return parsed as FileUploadMetadata;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const existingMetadata = parseExistingMetadata(defaultValue);
  const [uploadedMetadata, setUploadedMetadata] = useState<FileUploadMetadata | null>(
    existingMetadata
  );
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const uploadSteps = [
    { title: "Reading file", icon: <FileOutlined /> },
    { title: "Encrypting", icon: <LockOutlined /> },
    { title: "Preparing upload", icon: <SafetyCertificateOutlined /> },
    { title: "Uploading", icon: <CloudUploadOutlined /> },
    { title: "Complete", icon: <CheckCircleOutlined /> },
  ];

  const downloadSteps = [
    { title: "Authenticating", icon: <SafetyCertificateOutlined /> },
    { title: "Downloading", icon: <CloudDownloadOutlined /> },
    { title: "Decrypting", icon: <LockOutlined /> },
    { title: "Saving file", icon: <FileOutlined /> },
    { title: "Complete", icon: <CheckCircleOutlined /> },
  ];

  useEffect(() => {
    const parsed = parseExistingMetadata(defaultValue);
    if (parsed) {
      setUploadedMetadata(parsed);
    } else if (!defaultValue) {
      setUploadedMetadata(null);
    }
  }, [defaultValue]);

  const validateFile = (file: RcFile): boolean => {
    // Check file size
    if (file.size > maxFileSize) {
      message.error(`File size must be less than ${fieldConfig.maxFileSize || 10} MB`);
      return false;
    }

    // Check file type if restrictions exist
    if (allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some((type) => {
        if (type.endsWith("/*")) {
          const prefix = type.slice(0, -2);
          return file.type.startsWith(prefix);
        }
        return file.type === type;
      });

      if (!isAllowed) {
        message.error(`File type ${file.type} is not allowed`);
        return false;
      }
    }

    return true;
  };

  const handleUpload = async (file: RcFile) => {
    if (!validateFile(file)) {
      return false;
    }

    setUploading(true);
    setCurrentStep(0);

    try {
      if (!formAuthorPubkey) {
        throw new Error("Form author public key not available");
      }

      // Step 0: Read file as Uint8Array
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      setCurrentStep(1);

      // Step 1: Encrypt file TO form author
      // Always uses responderSecretKey (signers can't handle large files)
      const { ciphertext, uploaderPubkey } = await encryptFileToAuthor(
        fileBytes,
        formAuthorPubkey,
        responderSecretKey
      );
      setCurrentStep(2);

      // Step 2: Convert encrypted ciphertext to bytes for upload & create auth
      const encryptedBytes = new TextEncoder().encode(ciphertext);
      const sha256Hash = await calculateSHA256(encryptedBytes);
      const authHeader = await createAuthEvent("upload", sha256Hash, 60, responderSecretKey);
      setCurrentStep(3);

      // Step 3: Upload to Blossom server
      const client = new BlossomClient(blossomServer);
      const uploadResponse = await client.upload(encryptedBytes, authHeader);

      // Parse upload response to get actual sha256
      const uploadData = JSON.parse(uploadResponse);
      const actualSha256 = uploadData.sha256;

      // Create metadata using actual sha256 from server
      const metadata: FileUploadMetadata = {
        sha256: actualSha256,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        server: blossomServer,
        uploadedAt: Math.floor(Date.now() / 1000),
        uploaderPubkey, // Store the pubkey used for encryption
      };

      const metadataString = JSON.stringify(metadata);
      setUploadedMetadata(metadata);
      onChange(metadataString, file.name);
      setCurrentStep(4);

      message.success("File uploaded successfully!");
    } catch (error: any) {
      console.error("Upload failed:", error);
      if (error.isCorsError) {
        message.error("CORS error: The server may not allow uploads from this origin");
      } else {
        message.error(`Upload failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      setUploading(false);
      setTimeout(() => setCurrentStep(0), 1000);
    }

    return false; // Prevent default upload behavior
  };

  const calculateSHA256 = async (data: Uint8Array): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleDownload = async () => {
    if (!uploadedMetadata) return;
    if (!formEditKey) {
      message.error("Cannot download: Form edit key not available");
      return;
    }
    if (!uploaderPubkey) {
      message.error("Cannot download: Uploader public key not available");
      return;
    }

    setDownloading(true);
    setCurrentStep(0);

    try {
      // Step 0: Create auth event for download (use formEditKey)
      const formEditKeyBytes = hexToBytes(formEditKey);
      const authHeader = await createAuthEvent("get", uploadedMetadata.sha256, 60, formEditKeyBytes);
      setCurrentStep(1);

      // Step 1: Download from Blossom server
      const client = new BlossomClient(uploadedMetadata.server);
      const encryptedBytes = await client.download(uploadedMetadata.sha256, authHeader);
      setCurrentStep(2);

      console.log('Downloaded bytes length:', encryptedBytes.length);
      console.log('Downloaded bytes preview:', encryptedBytes.slice(0, 20));

      // Step 2: Convert bytes to ciphertext string & decrypt
      const ciphertext = new TextDecoder().decode(encryptedBytes);

      console.log('Ciphertext length:', ciphertext.length);
      console.log('Ciphertext preview:', ciphertext.substring(0, 50));

      // Decrypt file using form editKey + uploader's pubkey (from response event)
      const decryptedBytes = await decryptFileFromUploader(
        ciphertext,
        formEditKey,
        uploaderPubkey
      );
      setCurrentStep(3);

      // Step 3: Trigger browser download with original filename
      const blob = new Blob([decryptedBytes], { type: uploadedMetadata.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = uploadedMetadata.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setCurrentStep(4);

      message.success("File downloaded successfully!");
    } catch (error: any) {
      console.error("Download failed:", error);
      if (error.isCorsError) {
        message.error("CORS error: The server may not allow downloads from this origin");
      } else {
        message.error(`Download failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      setDownloading(false);
      setTimeout(() => setCurrentStep(0), 1000);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const hasUploadedFile = !!uploadedMetadata;

  return (
    <div style={{ width: "100%" }}>
      {!hasUploadedFile && !uploading && (
        <Dragger
          beforeUpload={handleUpload}
          showUploadList={false}
          disabled={disabled}
          accept={allowedTypes.join(",")}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to upload</p>
          <p className="ant-upload-hint">
            Files are encrypted with NIP-44 before upload
          </p>
          <p className="ant-upload-hint" style={{ fontSize: "12px" }}>
            Max size: {fieldConfig.maxFileSize || 10} MB
            {allowedTypes.length > 0 && (
              <> • Allowed: {allowedTypes.join(", ")}</>
            )}
          </p>
        </Dragger>
      )}

      {(uploading || downloading) && (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text strong style={{ marginBottom: 16, display: "block" }}>
            {uploading ? "Uploading file..." : "Downloading file..."}
          </Text>
          <Steps
            current={currentStep}
            size="small"
            items={uploading ? uploadSteps : downloadSteps}
          />
        </Space>
      )}

      {hasUploadedFile && (
        <div
          style={{
            backgroundColor: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 20 }} />
              <Text strong style={{ fontSize: 16 }}>
                File Uploaded
              </Text>
            </div>

            <div style={{ paddingLeft: 28 }}>
              <Text strong>Filename:</Text> <Text>{uploadedMetadata.filename}</Text>
            </div>

            <div style={{ paddingLeft: 28 }}>
              <Text strong>Size:</Text> <Text>{formatFileSize(uploadedMetadata.size)}</Text>
            </div>

            <div style={{ paddingLeft: 28 }}>
              <Text strong>Type:</Text> <Text>{uploadedMetadata.mimeType}</Text>
            </div>

            <div style={{ paddingLeft: 28 }}>
              <Text strong>Uploaded:</Text> <Text>{formatDate(uploadedMetadata.uploadedAt)}</Text>
            </div>

            <div style={{ paddingLeft: 28 }}>
              <Text strong>Server:</Text>{" "}
              <Text
                style={{ fontSize: "12px", color: "#666", wordBreak: "break-all" }}
              >
                {uploadedMetadata.server}
              </Text>
            </div>

            <div
              style={{
                paddingLeft: 28,
                marginTop: 8,
                paddingTop: 8,
                borderTop: "1px solid #d9f7be",
              }}
            >
              <Text type="secondary" style={{ fontSize: "12px" }}>
                ✓ Encrypted with NIP-44
              </Text>
            </div>

            <div style={{ paddingLeft: 28, marginTop: 12 }}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                loading={downloading}
              >
                Download File
              </Button>
            </div>
          </Space>
        </div>
      )}
    </div>
  );
};
