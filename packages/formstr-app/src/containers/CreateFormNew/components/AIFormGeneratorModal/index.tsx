import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Divider, message, Button, Typography } from 'antd';
import { ollamaService, OllamaModel, OllamaConfig } from '../../../../services/ollamaService';
import { processOllamaFormData } from './aiProcessor';
import { AIFormGeneratorModalProps } from './types';
import OllamaSettings from '../../../../components/OllamaSettings';
import ModelSelector from '../../../../components/ModelSelector';
import GenerationPanel from './GenerationPanel';
import './styles.css';

const FORM_GENERATION_SYSTEM_PROMPT = `You are an expert JSON generator. Based on the user's request, create or update a form structure.
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
- If existing form context is provided, treat it as the source of truth.
- When the user asks to add/edit/update/remove fields, return the full updated form (not only deltas).
- Preserve unchanged fields unless the user asks to modify or remove them.

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

const AIFormGeneratorModal: React.FC<AIFormGeneratorModalProps> = ({ isOpen, onClose, onFormGenerated, currentFormContext }) => {
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
            message.success('Successfully connected to Ollama!');
            setConnectionStatus(true);
            fetchModels();
        } else {
            setConnectionStatus(false);
            if (result.error === 'EXTENSION_NOT_FOUND') {
                message.error(
                    <>
                        Ollama Web Companion extension not found. Please install it to use this feature.
                        <Button
                            type="link"
                            href="https://github.com/ashu01304/Ollama_Web"
                            target="_blank"
                        >
                            Get Extension
                        </Button>
                    </>,
                    10
                );
            } else {
                message.error(`Connection failed: ${result.error}`);
            }
        }
    }, [fetchModels]);

    useEffect(() => {
        if (isOpen) {
            testConnection();
        }
    }, [isOpen, testConnection]);

    const handleClose = () => {
        setPrompt('');
        onClose();
    };

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
            message.error('Please enter a description for the form.');
            return;
        }
        setGenerating(true);
        try {
            const hasExistingForm = Boolean(currentFormContext?.fields?.length);
            const serializedContext = JSON.stringify(
                currentFormContext || { title: "", description: "", fields: [] },
                null,
                2
            );
            const generationPrompt = `USER REQUEST: "${prompt}"
EXISTING FORM CONTEXT:
${serializedContext}
GUIDANCE:
- If the user asks to update the existing form, apply the changes to the context and return the full result.
- If the user asks to create from scratch, ignore existing context and build a fresh form.
- If the request is ambiguous and existing context has fields, prefer updating it.
MODE_HINT: ${hasExistingForm ? "update_or_create" : "create"}
YOUR JSON RESPONSE:`;

            const result = await ollamaService.generate({
              prompt: generationPrompt,
              system: FORM_GENERATION_SYSTEM_PROMPT,
              format: "json",
            });

            if (result.success && result.data?.response) {
                const processedData = processOllamaFormData(JSON.parse(result.data.response));
                onFormGenerated(processedData);
                message.success('Form generated successfully!');
                handleClose();
            } else {
                message.error(result.error || 'An unexpected error occurred during generation.');
            }
        } catch (err: any) {
            message.error(err.message || 'An unknown error occurred.');
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
            title="AI Form Generator"
            open={isOpen}
            onCancel={handleClose}
            footer={null}
            width={800}
        >
            <Typography.Text type="secondary">
                Powered by your local Ollama instance via the Formstr Companion extension.
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
                    Test Connection
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
                hasExistingForm={Boolean(currentFormContext?.fields?.length)}
            />
        </Modal>
    );
};

export default AIFormGeneratorModal;