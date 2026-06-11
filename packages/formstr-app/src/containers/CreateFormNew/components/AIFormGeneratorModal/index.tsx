import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Divider, message, Button, Typography, Select, Progress } from 'antd';
import { llmService, LLMProvider } from '../../../../services/webLLM';
import { OllamaConfig } from '../../../../services/ollamaService';
import { getItem, setItem, LOCAL_STORAGE_KEYS } from '../../../../utils/localStorage';
import { processOllamaFormData } from './aiProcessor';
import { extractJsonFromText } from '../../../../utils/parseJsonFromText';
import { AIFormGeneratorModalProps } from './types';
import OllamaSettings from '../../../../components/OllamaSettings';
import ModelSelector from '../../../../components/ModelSelector';
import GenerationPanel from './GenerationPanel';
import { wllamaService } from '../../../../services/webLLM/wllamaService';
import './styles.css';
import { useTranslation } from 'react-i18next';

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
// const FORM_GENERATION_SYSTEM_PROMPT = `You are a JSON generator. Output ONLY raw JSON, nothing else.
// No markdown, no code fences, no backticks, no explanation.
// Your entire response must start with { and end with }.

// Required JSON structure:
// {
//   "title": "string",
//   "description": "string",
//   "fields": [
//     {
//       "type": "ShortText|LongText|Email|Number|MultipleChoice|SingleChoice|Checkbox|Dropdown|Date|Time|Label",
//       "label": "string",
//       "required": true|false,
//       "options": ["only for MultipleChoice/SingleChoice/Dropdown"]
//     }
//   ]
// }

// RULES:
// - Start with { immediately, no preamble
// - End with } immediately, no postamble  
// - No \`\`\`json or \`\`\` anywhere
// - No comments`;
type AnyConfig = OllamaConfig | { modelName: string; [key: string]: any };
type AnyModel = { name: string; [key: string]: any };

const AIFormGeneratorModal: React.FC<AIFormGeneratorModalProps> = ({ isOpen, onClose, onFormGenerated }) => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
    const [availableModels, setAvailableModels] = useState<AnyModel[]>([]);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [config, setConfig] = useState<AnyConfig>(
        llmService.activeService.getConfig?.() || { modelName: '', baseUrl: '' }
    );
    const [provider, setProvider] = useState<LLMProvider>(
        getItem<LLMProvider>(LOCAL_STORAGE_KEYS.LLM_PROVIDER) || LLMProvider.OLLAMA
    );
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [loadingGGUF, setLoadingGGUF] = useState<boolean>(false);
    const [wllamaModelName, setWllamaModelName] = useState<string>('');

    const fetchModels = useCallback(async () => {
        setFetchingModels(true);
        const result = await llmService.fetchModels();
        if (result.success && result.models) {
            setAvailableModels(result.models);
        } else {
            setAvailableModels([]);
        }
        setFetchingModels(false);
    }, []);

    const testConnection = useCallback(async () => {
        setLoading(true);
        const result = await llmService.testConnection();
        setLoading(false);
        if (result.success) {
            if (provider === LLMProvider.OLLAMA) {
                message.success(t('builder.aiGenerator.connectionSuccess'));
            }
            setConnectionStatus(true);
            fetchModels();
        } else {
            setConnectionStatus(false);
            if (provider === LLMProvider.WLLAMA) {
                message.error(result.error || 'WebAssembly not supported');
                return;
            }
            if (result.error === 'EXTENSION_NOT_FOUND') {
                message.error(
                    <>
                        {t('builder.aiGenerator.extensionMissing')}
                        <Button type="link" href="https://github.com/ashu01304/Ollama_Web" target="_blank">
                            {t('builder.aiGenerator.getExtension')}
                        </Button>
                    </>,
                    10
                );
            } else {
                message.error(t('builder.aiGenerator.connectionFailed', { error: result.error }));
            }
        }
    }, [fetchModels, provider, t]);

    useEffect(() => {
        if (isOpen) testConnection();
    }, [isOpen, testConnection]);

    const handleProviderChange = (newProvider: LLMProvider) => {
        setProvider(newProvider);
        setItem(LOCAL_STORAGE_KEYS.LLM_PROVIDER, newProvider);
        setConnectionStatus(null);
        setConfig((llmService.activeService.getConfig?.() as AnyConfig) || { modelName: '', baseUrl: '' });
    };

    const handleGGUFFileSelected = async (file: File) => {
        setLoadingGGUF(true);
        setDownloadProgress(0);
        try {
            await wllamaService.loadGGUFFile(file, (progress) => setDownloadProgress(progress));
            wllamaService.setConfig({ modelName: file.name });
            setWllamaModelName(file.name);
            handleConfigChange({ modelName: file.name });
            setConnectionStatus(true);
            message.success('GGUF model loaded successfully!');
        } catch (e: any) {
            setConnectionStatus(false);
            message.error(`Failed to load GGUF file: ${e.message}`);
        } finally {
            setLoadingGGUF(false);
        }
    };

    const handleConfigChange = (newConfig: Partial<AnyConfig>) => {
        const updatedConfig = { ...config, ...newConfig };
        setConfig(updatedConfig);
        llmService.activeService.setConfig?.(updatedConfig);
    };

    const handleModelChange = (newModel: string) => handleConfigChange({ modelName: newModel });

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            message.error(t('builder.aiGenerator.promptRequired'));
            return;
        }
        setGenerating(true);
        try {
            const result = await llmService.generate({
                prompt: `USER REQUEST: "${prompt}"\nYOUR JSON RESPONSE:`,
                system: FORM_GENERATION_SYSTEM_PROMPT,
                format: 'json',
                modelName: provider === LLMProvider.WLLAMA ? wllamaModelName : (config as OllamaConfig).modelName,
            });
            console.log('Generate result:', JSON.stringify(result, null, 2));
            if (result.success && result.data?.response) {
                const processedData = processOllamaFormData(extractJsonFromText(result.data.response));
                onFormGenerated(processedData);
                message.success(t('builder.aiGenerator.generatedSuccess'));
                onClose();
            } else {
                message.error(result.error || t('builder.aiGenerator.generationUnexpected'));
            }
        } catch (err: any) {
            message.error(err.message || t('builder.aiGenerator.generationUnknown'));
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
            title={t('builder.aiGenerator.title')}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={800}
            className="ai-generator-modal"
        >
            <div className="ai-provider-header">
                <div className="ai-provider-label">
                    <Typography.Text strong>{t('builder.aiGenerator.provider')}</Typography.Text>
                    <Typography.Text type="secondary" className="provider-subtitle">
                        {t('builder.aiGenerator.chooseModel')}
                    </Typography.Text>
                </div>
                <Select
                    value={provider}
                    onChange={handleProviderChange}
                    options={[
                        { label: 'Ollama (Extension)', value: LLMProvider.OLLAMA },
                        { label: 'Wllama (Local GGUF)', value: LLMProvider.WLLAMA },
                    ]}
                    className="ai-provider-select"
                    dropdownMatchSelectWidth={false}
                />
            </div>

            <Typography.Text type="secondary" className="ai-powered-by">
                {provider === LLMProvider.OLLAMA
                    ? t('builder.aiGenerator.poweredByLocal')
                    : 'Powered by Wllama (WebAssembly + WebGPU)'}
            </Typography.Text>

            <Divider className="ai-modal-divider" />

            {provider === LLMProvider.WLLAMA && (
                <Typography.Paragraph className="wllama-instruction">
                    Select a GGUF file to run AI locally in your browser. WebGPU will be used automatically if your browser supports it, with WebAssembly as fallback.
                </Typography.Paragraph>
            )}

            <div className="ai-modal-controls-container">
                <div className="ai-modal-model-selector-wrapper">
                    <ModelSelector
                        model={config.modelName}
                        setModel={handleModelChange}
                        availableModels={availableModels as any}
                        fetching={fetchingModels || loadingGGUF}
                        disabled={provider === LLMProvider.OLLAMA && !connectionStatus}
                        style={{ width: '100%' }}
                        provider={provider}
                        onFileSelected={handleGGUFFileSelected}
                        loading={loadingGGUF}
                    />
                </div>
                {provider === LLMProvider.OLLAMA && (
                    <Button onClick={testConnection} loading={loading} {...getButtonProps()}>
                        {t('builder.aiGenerator.testConnection')}
                    </Button>
                )}
            </div>

            {loadingGGUF && downloadProgress > 0 && (
                <Progress percent={downloadProgress} status="active" className="download-progress" />
            )}

            {provider === LLMProvider.OLLAMA && <OllamaSettings />}

            <Divider className="ai-modal-divider" />
            <GenerationPanel
                prompt={prompt}
                setPrompt={setPrompt}
                onGenerate={handleGenerate}
                loading={generating}
                disabled={
                    (provider === LLMProvider.OLLAMA && !connectionStatus) ||
                    (provider === LLMProvider.WLLAMA && !wllamaModelName)
                }
            />
        </Modal>
    );
};

export default AIFormGeneratorModal;