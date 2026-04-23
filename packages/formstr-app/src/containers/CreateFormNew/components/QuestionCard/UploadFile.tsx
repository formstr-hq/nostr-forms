import { PictureOutlined, AudioOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { Button, Modal, Input, Tabs, Alert, Typography } from "antd";
import React, { useState } from "react";
const { Text } = Typography;

interface Props {
  onImageUpload?: (url: string) => void;
}

type MediaType = "image" | "audio" | "video";

const UploadFile: React.FC<Props> = ({ onImageUpload }) => {
  const [urlInput, setUrlInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>("image");

  const formatMediaUrl = (url: string, mediaType: MediaType = "image") => {
    if (mediaType === "image") {
      const fileName = (url.split("/").pop()?.replace(/\.[^/.]+$/, "") || "image").slice(0, 5);
      return `![${fileName}](${url})`;
    } else if (mediaType === "audio") {
      return `<audio controls src="${url}"></audio>`;
    } else if (mediaType === "video") {
      return `<video controls src="${url}" style="max-width:100%;max-height:300px;"></video>`;
    }
    return "";
  };

  const showModal = () => {
    setIsModalOpen(true);
    setPreviewError(false);
    setUrlInput("");
    setSelectedMediaType("image");
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setUrlInput("");
    setPreviewError(false);
    setSelectedMediaType("image");
  };

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUrlInput(e.target.value);
    setPreviewError(false);
  };

  const handlePreviewError = () => {
    setPreviewError(true);
  };

  const handleUrlSubmit = (mediaType: MediaType) => {
    if (urlInput && !previewError) {
      onImageUpload?.(formatMediaUrl(urlInput, mediaType));
      setIsModalOpen(false);
      setUrlInput("");
      setPreviewError(false);
    }
  };

  const renderMediaTab = (mediaType: MediaType) => (
    <div style={{ padding: "20px 0" }}>
      <Input.TextArea
        placeholder={`Enter ${mediaType} URL`}
        value={urlInput}
        onChange={handleUrlInputChange}
        style={{ marginBottom: 16 }}
        rows={4}
        aria-label={`${mediaType} URL input`}
      />
      {urlInput && selectedMediaType === mediaType && (
        <div style={{ marginBottom: 16 }}>
          {previewError ? (
            <Alert
              message={`Invalid ${mediaType} URL`}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          ) : (
            <div
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: "8px",
                padding: "8px",
                marginBottom: "16px",
              }}
            >
              <Text style={{ display: "block", marginBottom: 8 }}>Preview:</Text>
              {mediaType === "image" ? (
                <img
                  src={urlInput}
                  alt="Preview"
                  onError={handlePreviewError}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "200px",
                    objectFit: "contain",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              ) : mediaType === "audio" ? (
                <audio controls src={urlInput} onError={handlePreviewError} style={{ width: "100%" }} />
              ) : (
                <video
                  controls
                  src={urlInput}
                  onError={handlePreviewError}
                  style={{ maxWidth: "100%", maxHeight: "200px", display: "block" }}
                />
              )}
            </div>
          )}
        </div>
      )}
      <Button
        type="primary"
        onClick={() => handleUrlSubmit(mediaType)}
        disabled={!urlInput || previewError}
        style={{ width: "100%" }}
      >
        Submit URL
      </Button>
    </div>
  );

  const items = [
    {
      key: "image",
      label: <span><PictureOutlined /> Image</span>,
      children: renderMediaTab("image"),
    },
    {
      key: "audio",
      label: <span><AudioOutlined /> Audio</span>,
      children: renderMediaTab("audio"),
    },
    {
      key: "video",
      label: <span><VideoCameraOutlined /> Video</span>,
      children: renderMediaTab("video"),
    },
  ];

  return (
    <div>
      <Button onClick={showModal} type="default" style={{ marginRight: "10px" }}>
        Media
      </Button>

      <Modal
        title="Upload Media"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={480}
      >
        <Tabs
          defaultActiveKey="image"
          items={items}
          onChange={(key) => {
            setSelectedMediaType(key as MediaType);
            setUrlInput("");
            setPreviewError(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default UploadFile;