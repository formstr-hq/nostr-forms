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
  LinearProgress,
  Link,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { OllamaConfig } from "../../../../services/ollamaService";
import { llmService, LLMProvider } from "../../../../services/webLLM";
import { wllamaService } from "../../../../services/webLLM/wllamaService";
import {
  getItem,
  setItem,
  LOCAL_STORAGE_KEYS,
} from "../../../../utils/localStorage";
import { extractJsonFromText } from "../../../../utils/parseJsonFromText";
import { processOllamaFormData } from "./aiProcessor";
import { AIFormGeneratorModalProps } from "./types";
import OllamaSettings from "../../../../components/OllamaSettings";
import ModelSelector from "../../../../components/ModelSelector";
import GenerationPanel from "./GenerationPanel";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "../../../../providers/SnackbarProvider";

const FORM_GENERATION_SYSTEM_PROMPT = `You are a JSON generator. Output ONLY raw JSON, nothing else.
No markdown, no code fences, no backticks, no explanation.
Your entire response must start with { and end with }.

Required JSON structure:
{
  "title": "string",
  "description": "string",
  "fields": [
    {
      "type": "ShortText|LongText|Email|Number|MultipleChoice|SingleChoice|Checkbox|Dropdown|Date|Time|Label",
      "label": "string",
      "required": true|false,
      "options": ["only for MultipleChoice/SingleChoice/Dropdown"]
    }
  ]
}

RULES:
- Start with { immediately, no preamble
- End with } immediately, no postamble  
- No \`\`\`json or \`\`\` anywhere
- No comments`;

type AnyConfig = OllamaConfig | { modelName: string; [key: string]: any };
type AnyModel = { name: string; [key: string]: any };

/**
 * MUI dialog (ui-rewrite-mui Phase 5), extended with multi-provider
 * (Ollama / Wllama) support. The extension-missing error renders inline
 * (the MUI snackbar is text-only) — everything else rides the snackbar
 * like the old antd `message` calls.
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
  const [availableModels, setAvailableModels] = useState<AnyModel[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [config, setConfig] = useState<AnyConfig>(
    llmService.activeService.getConfig?.() || { modelName: "", baseUrl: "" },
  );
  const [extensionMissing, setExtensionMissing] = useState(false);
  const [provider, setProvider] = useState<LLMProvider>(
    getItem<LLMProvider>(LOCAL_STORAGE_KEYS.LLM_PROVIDER) ||
      LLMProvider.OLLAMA,
  );
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [loadingGGUF, setLoadingGGUF] = useState<boolean>(false);
  const [wllamaModelName, setWllamaModelName] = useState<string>("");

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
        showMessage(t("builder.aiGenerator.connectionSuccess"), "success");
      }
      setConnectionStatus(true);
      setExtensionMissing(false);
      fetchModels();
    } else {
      setConnectionStatus(false);
      if (provider === LLMProvider.WLLAMA) {
        showMessage(result.error || "WebAssembly not supported", "error");
        return;
      }
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
  }, [fetchModels, provider, t, showMessage]);

  useEffect(() => {
    if (isOpen) {
      setExtensionMissing(false);
      testConnection();
    }
  }, [isOpen, testConnection]);

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    setItem(LOCAL_STORAGE_KEYS.LLM_PROVIDER, newProvider);
    setConnectionStatus(null);
    setExtensionMissing(false);
    setConfig(
      (llmService.activeService.getConfig?.() as AnyConfig) || {
        modelName: "",
        baseUrl: "",
      },
    );
  };

  const handleGGUFFileSelected = async (file: File) => {
    setLoadingGGUF(true);
    setDownloadProgress(0);
    try {
      await wllamaService.loadGGUFFile(file, (progress) =>
        setDownloadProgress(progress),
      );
      wllamaService.setConfig({ modelName: file.name });
      setWllamaModelName(file.name);
      handleConfigChange({ modelName: file.name });
      setConnectionStatus(true);
      showMessage("GGUF model loaded successfully!", "success");
    } catch (e: any) {
      setConnectionStatus(false);
      showMessage(`Failed to load GGUF file: ${e.message}`, "error");
    } finally {
      setLoadingGGUF(false);
    }
  };

  const handleConfigChange = (newConfig: Partial<AnyConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    llmService.activeService.setConfig?.(updatedConfig);
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
      const result = await llmService.generate({
        prompt: `USER REQUEST: "${prompt}"\nYOUR JSON RESPONSE:`,
        system: FORM_GENERATION_SYSTEM_PROMPT,
        format: "json",
        modelName:
          provider === LLMProvider.WLLAMA
            ? wllamaModelName
            : (config as OllamaConfig).modelName,
      });

      if (result.success && result.data?.response) {
        const processedData = processOllamaFormData(
          extractJsonFromText(result.data.response),
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 1.5,
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Provider
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose which model powers form generation
            </Typography>
          </Box>
          <Select
            size="small"
            value={provider}
            onChange={(e) =>
              handleProviderChange(e.target.value as LLMProvider)
            }
            sx={{ minWidth: 220 }}
          >
            <MenuItem value={LLMProvider.OLLAMA}>Ollama (Extension)</MenuItem>
            <MenuItem value={LLMProvider.WLLAMA}>Wllama (Local GGUF)</MenuItem>
          </Select>
        </Box>

        <Typography color="text.secondary" sx={{ mb: 1.5 }}>
          {provider === LLMProvider.OLLAMA
            ? t("builder.aiGenerator.poweredBy")
            : "Powered by Wllama (WebAssembly + WebGPU)"}
        </Typography>
        <Divider sx={{ my: 1.5 }} />

        {provider === LLMProvider.WLLAMA && (
          <Typography sx={{ mb: 1.5, fontWeight: 500 }}>
            Select a GGUF file to run AI locally in your browser. WebGPU
            will be used automatically if your browser supports it, with
            WebAssembly as fallback.
          </Typography>
        )}

        {extensionMissing && provider === LLMProvider.OLLAMA && (
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
              availableModels={availableModels as any}
              fetching={fetchingModels || loadingGGUF}
              disabled={provider === LLMProvider.OLLAMA && !connectionStatus}
              style={{ width: "100%" }}
              provider={provider}
              onFileSelected={handleGGUFFileSelected}
              loading={loadingGGUF}
            />
          </Box>
          {provider === LLMProvider.OLLAMA && (
            <Button
              variant="outlined"
              onClick={testConnection}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : undefined}
              sx={connectionButtonSx}
            >
              {t("builder.aiGenerator.testConnection")}
            </Button>
          )}
        </Box>

        {loadingGGUF && downloadProgress > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <LinearProgress variant="determinate" value={downloadProgress} />
          </Box>
        )}

        {provider === LLMProvider.OLLAMA && <OllamaSettings />}
        <Divider sx={{ my: 1.5 }} />

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
      </DialogContent>
    </Dialog>
  );
};

export default AIFormGeneratorModal;