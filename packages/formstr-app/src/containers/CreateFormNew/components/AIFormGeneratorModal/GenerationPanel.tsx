import React from 'react';
import { Input, Button, Typography, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { GenerationPanelProps } from './types';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const GenerationPanel: React.FC<GenerationPanelProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  loading,
  disabled,
}) => {
  const placeholderText = "e.g., A simple contact form with name, email (required), and message fields. Make the message field a paragraph.";
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <Text strong>Describe the form you want to create</Text>
        <Tooltip title="Be specific! Mention field names, types (like text, email, number, paragraph, date, checkbox, radio button, dropdown), whether they are required, and any options for choice-based fields.">
            <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--app-color-text-muted)', cursor: 'help' }} />
        </Tooltip>
      </div>
      <TextArea
        rows={5}
        placeholder={placeholderText}
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        disabled={loading || disabled}
        aria-label="Form description prompt"
        style={{ marginBottom: 8 }}
      />
      <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: 0, marginBottom: 16 }}>
        The AI will attempt to create fields based on your description. Review and adjust the generated form afterwards.
      </Paragraph>
      <Button
        type="primary"
        block
        onClick={onGenerate}
        loading={loading}
        disabled={disabled || !prompt.trim()}
      >
        {loading ? 'Generating...' : 'Generate Form'}
      </Button>
    </div>
  );
};

export default GenerationPanel;