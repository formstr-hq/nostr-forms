import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Divider, message, Button, Typography } from 'antd';
import { ollamaService, OllamaModel, OllamaConfig } from '../../../../services/ollamaService';
import { processOllamaFormData } from './aiProcessor';
import { AIFormGeneratorModalProps } from './types';
import OllamaSettings from '../../../../components/OllamaSettings';
import ModelSelector from '../../../../components/ModelSelector';
import GenerationPanel from './GenerationPanel';
import './styles.css';
import { useTranslation } from "react-i18next";

const FORM_GENERATION_SYSTEM_PROMPT = `You are an expert JSON generator. Based on the user's request, create a form structure.
Here is the required JSON schema for the form:
{
    "type": "object",
    "properties": {
        "title": { "type": "string" },
        "description": { "type": "string" },
        "fields": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": { "type": "string", "enum": ["ShortText", "LongText", "Email", "Number", "MultipleChoice", "SingleChoice", "Checkbox", "Dropdown", "Date", "Time", "Label"] },
                    "label": { "type": "string" },
                    "required": { "type": "boolean" },
                    "options": { "type": "array", "items": { "type": "string" } }
                },
                "required": ["type", "label"]
            }
        }
    },
    "required": ["title", "fields"]
}
CRITICAL RULES:
- Your response MUST be ONLY the JSON object that validates against the schema above.
- Do NOT include any extra text, explanations, or markdown formatting like \`\`\`json.

For Example for output with one field:
"{
  "title": "Appropriate Form Title",
  "description": "Appropriate Form Description",
  "fields": [
    {
      "type": "ShortText",
      "label": "Name",
      "required": true
    }
  ]
}"
`;

const AIFormGeneratorModal: React.FC<AIFormGeneratorModalProps> = ({ isOpen, onClose, onFormGenerated }) => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
    const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [config, setConfig] = useState<OllamaConfig>(ollamaService.getConfig());

    const fetchModels = useCallback(async () => {
        setFetchingModels(true);
        const result = await ollamaService.fetchModels();
        if (result.success && result.models) {
            setAvailableModels(result.models);
        } else {
            setAvailableModels([]);
        }
        setFetchingModels(false);
    }, []);

    const testConnection = useCallback(async () => {
        setLoading(true);
        const result = await ollamaService.testConnection();
        setLoading(false);
        if (result.success) {
            message.success(t("builder.aiGenerator.connectionSuccess"));
            setConnectionStatus(true);
            fetchModels();
        } else {
            setConnectionStatus(false);
            if (result.error === 'EXTENSION_NOT_FOUND') {
                message.error(
                    <>
                        {t("builder.aiGenerator.extensionMissing")}
                        <Button
                            type="link"
                            href="https://github.com/ashu01304/Ollama_Web"
                            target="_blank"
                        >
                            {t("builder.aiGenerator.getExtension")}
                        </Button>
                    </>,
                    10
                );
            } else {
                message.error(
                    t("builder.aiGenerator.connectionFailed", {
                        error: result.error,
                    }),
                );
            }
        }
    }, [fetchModels]);

    useEffect(() => {
        if (isOpen) {
            testConnection();
        }
    }, [isOpen, testConnection]);

    const handleConfigChange = (newConfig: Partial<OllamaConfig>) => {
        const updatedConfig = { ...config, ...newConfig };
        setConfig(updatedConfig);
        ollamaService.setConfig(updatedConfig);
    };

    const handleModelChange = (newModel: string) => {
        handleConfigChange({ modelName: newModel });
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            message.error(t("builder.aiGenerator.promptRequired"));
            return;
        }
        setGenerating(true);
        try {
            const result = await ollamaService.generate({
              prompt: `USER REQUEST: "${prompt}"\nYOUR JSON RESPONSE:`,
              system: FORM_GENERATION_SYSTEM_PROMPT,
              format: "json",
            });

            if (result.success && result.data?.response) {
                const processedData = processOllamaFormData(JSON.parse(result.data.response));
                onFormGenerated(processedData);
                message.success(t("builder.aiGenerator.generatedSuccess"));
                onClose();
            } else {
                message.error(
                    result.error ||
                      t("builder.aiGenerator.generationUnexpected"),
                );
            }
        } catch (err: any) {
            message.error(err.message || t("builder.aiGenerator.generationUnknown"));
        } finally {
            setGenerating(false);
        }
    };

    const getButtonProps = () => {
        if (connectionStatus === true) {
            return { className: 'ai-modal-button-success' };
        }
        if (connectionStatus === false) {
            return { className: 'ai-modal-button-danger' };
        }
        return {};
    };

    return (
        <Modal
            title={t("builder.aiGenerator.title")}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={800}
        >
            <Typography.Text type="secondary">
                {t("builder.aiGenerator.poweredBy")}
            </Typography.Text>
            <Divider className="ai-modal-divider" />
            <div className="ai-modal-controls-container">
                <div className="ai-modal-model-selector-wrapper">
                    <ModelSelector
                        model={config.modelName}
                        setModel={handleModelChange}
                        availableModels={availableModels}
                        fetching={fetchingModels}
                        disabled={!connectionStatus}
                        style={{ width: '100%' }}
                    />
                </div>
                <Button
                    onClick={testConnection}
                    loading={loading}
                    {...getButtonProps()}
                >
                    {t("builder.aiGenerator.testConnection")}
                </Button>
            </div>
            <OllamaSettings />
            <Divider className="ai-modal-divider" />
            <GenerationPanel
                prompt={prompt}
                setPrompt={setPrompt}
                onGenerate={handleGenerate}
                loading={generating}
                disabled={!connectionStatus || availableModels.length === 0}
            />
        </Modal>
    );
};

export default AIFormGeneratorModal;
