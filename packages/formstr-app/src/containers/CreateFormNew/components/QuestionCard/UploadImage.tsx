import { PictureOutlined } from "@ant-design/icons";
import { Button, Modal, Input, Tabs, Alert, Typography } from "antd";
import React, { useState, ChangeEvent, useRef } from "react";
const { Text } = Typography;

interface Props {
  onImageUpload?: (url: string) => void;
}

const UploadImage: React.FC<Props> = ({ onImageUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [urlInput, setUrlInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const formatImageUrl = (url: string, customName?: string) => {
    const fileName = (customName || url.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'image')
      .slice(0, 5);
    return `![${fileName}](${url})`;
  };

  const showModal = () => {
    setIsModalOpen(true);
    setPreviewError(false);
    setUrlInput("");
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setUrlInput("");
    setPreviewError(false);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUrlSubmit = () => {
    if (urlInput && !previewError) {
      onImageUpload?.(formatImageUrl(urlInput));
      setIsModalOpen(false);
      setUrlInput("");
      setPreviewError(false);
    }
  };

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const url = e.target.value;
    setUrlInput(url);
    setPreviewError(false); // Reset error state when input changes
  };

  const handlePreviewError = () => {
    setPreviewError(true);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        "https://api.imgbb.com/1/upload?key=apikey",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.data?.display_url) {
        onImageUpload?.(formatImageUrl(result.data.display_url, file.name));
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const items = [
    {
      key: '2',
      label: 'Image URL',
      children: (
        <div style={{ padding: '20px 0' }}>
          <Input.TextArea
            placeholder="Enter image URL"
            value={urlInput}
            onChange={handleUrlInputChange}
            style={{ marginBottom: 16 }}
            rows={4}
            aria-label="Image URL input"
          />
          {urlInput && (
            <div style={{ marginBottom: 16 }}>
              {previewError ? (
                <Alert
                  message="Invalid image URL"
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              ) : (
                <div className="image-preview-container" style={{
                  border: '1px solid var(--app-color-border)',
                  borderRadius: '8px',
                  padding: '8px',
                  marginBottom: '16px'
                }}>
                  <Text>Preview:</Text>
                  <img
                    src={urlInput}
                    alt="Preview"
                    onError={handlePreviewError}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto'
                    }}
                  />
                </div>
              )}
            </div>
          )}
          <Button 
            type="primary" 
            onClick={handleUrlSubmit}
            disabled={!urlInput || previewError}
            style={{ width: '100%' }}
          >
            Submit URL
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Button
        onClick={showModal}
        type="text"
        shape="circle"
        style={{ fontSize: '16px', marginRight: '10px' }}
      >
        <PictureOutlined />
      </Button>

      <Modal 
        title="Upload Image" 
        open={isModalOpen} 
        onCancel={handleCancel}
        footer={null}
        width={480}
        modalRender={(modal) => (
          <div ref={modalRef} tabIndex={-1}>
            {modal}
          </div>
        )}
      >
        <Tabs 
          defaultActiveKey="2" 
          items={items}
          centered
        />
      </Modal>

      {imageUrl && (
        <img 
          src={imageUrl} 
          alt="Uploaded" 
          style={{ maxWidth: '100%', marginTop: '16px', padding: '10px', border: '1px solid #ccc' }}
        />
      )}
    </div>
  );
};

export default UploadImage;