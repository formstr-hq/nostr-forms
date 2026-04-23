import React from 'react';
import { Input, Button, Typography, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { GenerationPanelProps } from './types';
import { useTranslation } from "react-i18next";

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const GenerationPanel: React.FC<GenerationPanelProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  loading,
  disabled,
}) => {
  const { t } = useTranslation();
  const placeholderText = t("builder.aiGenerator.placeholder");
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <Text strong>{t("builder.aiGenerator.describeTitle")}</Text>
        <Tooltip title={t("builder.aiGenerator.describeHelp")}>
            <InfoCircleOutlined style={{ marginLeft: 8, color: 'rgba(0, 0, 0, 0.45)', cursor: 'help' }} />
        </Tooltip>
      </div>
      <TextArea
        rows={5}
        placeholder={placeholderText}
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        disabled={loading || disabled}
        aria-label={t("builder.aiGenerator.ariaLabel")}
        style={{ marginBottom: 8 }}
      />
      <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: 0, marginBottom: 16 }}>
        {t("builder.aiGenerator.hint")}
      </Paragraph>
      <Button
        type="primary"
        block
        onClick={onGenerate}
        loading={loading}
        disabled={disabled || !prompt.trim()}
      >
        {loading
          ? t("builder.aiGenerator.generating")
          : t("builder.aiGenerator.generateForm")}
      </Button>
    </div>
  );
};

export default GenerationPanel;
