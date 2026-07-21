import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Typography,
} from "@mui/material";
import {
  ollamaService,
  OllamaModel,
  OllamaConfig,
} from "../../../../services/ollamaService";
import { processOllamaFormData } from "./aiProcessor";
import { AIFormGeneratorModalProps } from "./types";
import OllamaSettings from "../../../../components/OllamaSettings";
import ModelSelector from "../../../../components/ModelSelector";
import GenerationPanel from "./GenerationPanel";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "../../../../providers/SnackbarProvider";

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

/**
 * MUI dialog (ui-rewrite-mui Phase 5). The extension-missing error renders
 * inline (the MUI snackbar is text-only) — everything else rides the
 * snackbar like the old antd `message` calls.
 */
const AIFormGeneratorModal: React.FC<AIFormGeneratorModalProps> = ({
  isOpen,
  onClose,
  onFormGenerated,
}) => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(
    null,
  );
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [config, setConfig] = useState<OllamaConfig>(ollamaService.getConfig());
  const [extensionMissing, setExtensionMissing] = useState(false);

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
      showMessage(t("builder.aiGenerator.connectionSuccess"), "success");
      setConnectionStatus(true);
      setExtensionMissing(false);
      fetchModels();
    } else {
      setConnectionStatus(false);
      if (result.error === "EXTENSION_NOT_FOUND") {
        setExtensionMissing(true);
      } else {
        showMessage(
          t("builder.aiGenerator.connectionFailed", {
            error: result.error,
          }),
          "error",
        );
      }
    }
  }, [fetchModels]);

  useEffect(() => {
    if (isOpen) {
      setExtensionMissing(false);
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
      showMessage(t("builder.aiGenerator.promptRequired"), "error");
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
        const processedData = processOllamaFormData(
          JSON.parse(result.data.response),
        );
        onFormGenerated(processedData);
        showMessage(t("builder.aiGenerator.generatedSuccess"), "success");
        onClose();
      } else {
        showMessage(
          result.error || t("builder.aiGenerator.generationUnexpected"),
          "error",
        );
      }
    } catch (err: any) {
      showMessage(
        err.message || t("builder.aiGenerator.generationUnknown"),
        "error",
      );
    } finally {
      setGenerating(false);
    }
  };

  const connectionButtonSx =
    connectionStatus === true
      ? {
          bgcolor: "#52c41a",
          borderColor: "#52c41a",
          color: "#fff",
          "&:hover": { bgcolor: "#389e0d", borderColor: "#389e0d" },
        }
      : connectionStatus === false
      ? {
          bgcolor: "#f5222d",
          borderColor: "#f5222d",
          color: "#fff",
          "&:hover": { bgcolor: "#cf1322", borderColor: "#cf1322" },
        }
      : {};

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t("builder.aiGenerator.title")}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          {t("builder.aiGenerator.poweredBy")}
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        {extensionMissing && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {t("builder.aiGenerator.extensionMissing")}
            <Link
              href="https://github.com/ashu01304/Ollama_Web"
              target="_blank"
              sx={{ ml: 0.5 }}
            >
              {t("builder.aiGenerator.getExtension")}
            </Link>
          </Alert>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 1,
            mb: 1.5,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <ModelSelector
              model={config.modelName}
              setModel={handleModelChange}
              availableModels={availableModels}
              fetching={fetchingModels}
              disabled={!connectionStatus}
              style={{ width: "100%" }}
            />
          </Box>
          <Button
            variant="outlined"
            onClick={testConnection}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
            sx={connectionButtonSx}
          >
            {t("builder.aiGenerator.testConnection")}
          </Button>
        </Box>
        <OllamaSettings />
        <Divider sx={{ my: 1.5 }} />
        <GenerationPanel
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={handleGenerate}
          loading={generating}
          disabled={!connectionStatus || availableModels.length === 0}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AIFormGeneratorModal;
