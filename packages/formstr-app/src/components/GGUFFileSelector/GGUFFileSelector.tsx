import React from 'react';
import { Button, Upload, message, Space, Typography, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

interface GGUFFileSelectorProps {
  onFileSelected: (file: File) => Promise<void>;
  loading?: boolean;
  selectedFileName?: string;
  placeholder?: string;
}

const GGUFFileSelector: React.FC<GGUFFileSelectorProps> = ({
  onFileSelected,
  loading = false,
  selectedFileName,
  placeholder = "Select a GGUF file from your storage",
}) => {
  const handleBeforeUpload = async (file: File) => {
    // Validate extension
    if (!file.name.toLowerCase().endsWith('.gguf')) {
      message.error('Please select a valid GGUF file (*.gguf)');
      return Upload.LIST_IGNORE;
    }

    // Validate size (max 10GB)
    const maxSize = 10 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      message.error('File size exceeds 10GB limit');
      return Upload.LIST_IGNORE;
    }

    try {
      await onFileSelected(file);
    } catch (error: any) {
      message.error(`Failed to load model: ${error.message}`);
    }

    // Always prevent actual upload
    return false;
  };

  return (
    <div style={{ width: '100%' }}>
      <Upload
        maxCount={1}
        accept=".gguf"
        showUploadList={false}
        beforeUpload={handleBeforeUpload}
        disabled={loading}
      >
        <Button
          icon={<UploadOutlined />}
          loading={loading}
          disabled={loading}
          block
        >
          {loading ? 'Loading Model...' : 'Choose GGUF File'}
        </Button>
      </Upload>

      {selectedFileName && !loading && (
        <Typography.Text
          type="success"
          style={{ marginTop: '8px', display: 'block' }}
        >
          ✓ Loaded: {selectedFileName}
        </Typography.Text>
      )}
      {loading && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
          <Spin size="small" style={{ marginRight: '8px' }} />
          <Typography.Text type="secondary">Initializing model...</Typography.Text>
        </div>
      )}
      <Typography.Text
        type="secondary"
        style={{ marginTop: '8px', display: 'block', fontSize: '12px' }}
      >
        {placeholder}
      </Typography.Text>
    </div>
  );
};

export default GGUFFileSelector;
