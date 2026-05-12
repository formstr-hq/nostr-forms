import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Divider, message, Button, Typography, Select, Progress } from 'antd';
import { llmService, LLMProvider } from '../../../../services/webLLM';
import { OllamaModel, OllamaConfig } from '../../../../services/ollamaService';
import { getItem, setItem, LOCAL_STORAGE_KEYS } from '../../../../utils/localStorage';
import { processOllamaFormData } from './aiProcessor';
import { extractJsonFromText } from '../../../../utils/parseJsonFromText';
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
- Start with { and end with }
- Ensure all strings are properly quoted and all braces/brackets are balanced.
- Do NOT include any extra text, explanations, comments or markdown formatting like \`\`\`json.

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
    const [config, setConfig] = useState<OllamaConfig>(llmService.activeService.getConfig?.() || { modelName: '' });
    const [provider, setProvider] = useState<LLMProvider>(
        getItem<LLMProvider>(LOCAL_STORAGE_KEYS.LLM_PROVIDER) || LLMProvider.OLLAMA
    );
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [downloading, setDownloading] = useState<boolean>(false);

    const fetchModels = useCallback(async () => {
        setFetchingModels(true);
        const result = await llmService.fetchModels();
        if (result.success && result.models) {
            const modelsWithCache = await Promise.all(result.models.map(async m => ({
                ...m,
                cached: provider === LLMProvider.WEB_LLM ? await (llmService.activeService as any).isModelCached(m.name) : false
            })));
            setAvailableModels(modelsWithCache);
        } else {
            setAvailableModels([]);
        }
        setFetchingModels(false);
    }, [provider]);

    const testConnection = useCallback(async () => {
        setLoading(true);
        const result = await llmService.testConnection();
        setLoading(false);
        if (result.success) {
            if (provider === LLMProvider.OLLAMA) {
                message.success(t("builder.aiGenerator.connectionSuccess"));
            }
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
    }, [fetchModels, provider]);

    useEffect(() => {
        if (isOpen) {
            testConnection();
        }
    }, [isOpen, testConnection]);

    const handleProviderChange = (newProvider: LLMProvider) => {
        setProvider(newProvider);
        setItem(LOCAL_STORAGE_KEYS.LLM_PROVIDER, newProvider);
        setConnectionStatus(null);
        const nextConfig = llmService.activeService.getConfig?.() || { modelName: '' };
        setConfig(nextConfig);
    };

    const handleDownload = async () => {
        if (!config.modelName) {
            message.error('Please select a model first');
            return;
        }
        setDownloading(true);
        setDownloadProgress(0);
        try {
            await (llmService.activeService as any).downloadModel(config.modelName, (progressText: string) => {
                const match = progressText.match(/(\d+)%/);
                if (match) setDownloadProgress(parseInt(match[1]));
            });
            message.success('All set! Your model is ready to go.');
            fetchModels();
        } catch (e: any) {
            message.error(`Download failed: ${e.message}`);
        } finally {
            setDownloading(false);
        }
    };

    const handleDelete = async () => {
        if (!config.modelName) return;
        try {
            await (llmService.activeService as any).deleteModel(config.modelName);
            message.success('Model removed from cache');
            fetchModels();
        } catch (e: any) {
            message.error(`Failed to delete: ${e.message}`);
        }
    };

    const handleConfigChange = (newConfig: Partial<OllamaConfig>) => {
        const updatedConfig = { ...config, ...newConfig };
        setConfig(updatedConfig);
        llmService.activeService.setConfig?.(updatedConfig);
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
            const result = await llmService.generate({
                prompt: `USER REQUEST: "${prompt}"\nYOUR JSON RESPONSE:`,
                system: FORM_GENERATION_SYSTEM_PROMPT,
                format: "json",
                modelName: config.modelName,
            });

            if (result.success && result.data?.response) {
                const processedData = processOllamaFormData(extractJsonFromText(result.data.response));
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
        if (connectionStatus === true) return { className: 'ai-modal-button-success' };
        if (connectionStatus === false) return { className: 'ai-modal-button-danger' };
        return {};
    };

    return (
        <Modal
            title={t("builder.aiGenerator.title")}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={800}
            className="ai-generator-modal"
        >
            <div className="ai-provider-header">
                <div className="ai-provider-label">
                    <Typography.Text strong>{t("builder.aiGenerator.provider")}</Typography.Text>
                    <Typography.Text type="secondary" className="provider-subtitle">
                        {t("builder.aiGenerator.chooseModel")}
                    </Typography.Text>
                </div>
                <Select
                    value={provider}
                    onChange={handleProviderChange}
                    options={[
                        { label: 'Ollama (Extension)', value: LLMProvider.OLLAMA },
                        { label: 'WebLLM (In-Browser)', value: LLMProvider.WEB_LLM },
                    ]}
                    className="ai-provider-select"
                    dropdownMatchSelectWidth={false}
                />
            </div>

            <Typography.Text type="secondary" className="ai-powered-by">
                {provider === LLMProvider.OLLAMA
                    ? t("builder.aiGenerator.poweredByLocal")
                    : t("builder.aiGenerator.poweredByWeb")}
            </Typography.Text>

            <Divider className="ai-modal-divider" />

            {provider === LLMProvider.WEB_LLM && (
                <Typography.Paragraph className="web-llm-instruction">
                    {t("builder.aiGenerator.webLlmInstruction")}
                </Typography.Paragraph>
            )}
            {provider === LLMProvider.WEB_LLM && (
                <div className="web-llm-model-guide">
                    <Typography.Text strong>
                        {t("builder.aiGenerator.modelGuideTitle")}
                    </Typography.Text>
                    <ul>
                        <li>{t("builder.aiGenerator.modelGuideHigh")}</li>
                        <li>{t("builder.aiGenerator.modelGuideMid")}</li>
                        <li>{t("builder.aiGenerator.modelGuideLow")}</li>
                    </ul>
                </div>
            )}

            <div className="ai-modal-controls-container">
                <div className="ai-modal-model-selector-wrapper">
                    <ModelSelector
                        model={config.modelName}
                        setModel={handleModelChange}
                        availableModels={availableModels}
                        fetching={fetchingModels}
                        disabled={provider === LLMProvider.OLLAMA && !connectionStatus}
                        style={{ width: '100%' }}
                    />
                </div>
                {provider === LLMProvider.OLLAMA ? (
                    <Button
                        onClick={testConnection}
                        loading={loading}
                        {...getButtonProps()}
                    >
                        {t("builder.aiGenerator.testConnection")}
                    </Button>
                ) : (
                    <div className="web-llm-actions">
                        <Button
                            className="ai-modal-button-orange"
                            onClick={handleDownload}
                            loading={downloading}
                        >
                            {t("builder.aiGenerator.download")}
                        </Button>
                        <Button danger ghost onClick={handleDelete}>
                            {t("builder.aiGenerator.delete")}
                        </Button>
                    </div>
                )}
            </div>

            {downloading && (
                <Progress percent={downloadProgress} status="active" className="download-progress" />
            )}

            {provider === LLMProvider.OLLAMA && <OllamaSettings />}

            <Divider className="ai-modal-divider" />
            <GenerationPanel
                prompt={prompt}
                setPrompt={setPrompt}
                onGenerate={handleGenerate}
                loading={generating}
                disabled={(provider === LLMProvider.OLLAMA && !connectionStatus) || !config.modelName}
            />
        </Modal>
    );
};

export default AIFormGeneratorModal;
