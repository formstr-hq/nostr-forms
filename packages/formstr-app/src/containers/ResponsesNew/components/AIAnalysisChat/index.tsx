import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { AIAnalysisChatProps, Message } from "./types";
import { ollamaService, OllamaModel } from "../../../../services/ollamaService";
import ModelSelector from "../../../../components/ModelSelector";
import OllamaSettings from "../../../../components/OllamaSettings";
import { createAnalysisReport, runAnalysis } from "./analysisHelper";
import SafeMarkdown from "../../../../components/SafeMarkdown";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "../../../../providers/SnackbarProvider";

/**
 * MUI chat card (ui-rewrite-mui Phase 4). The footer sx anchors the
 * OllamaSettings accordion panel above the footer.
 */
const AIAnalysisChat: React.FC<AIAnalysisChatProps> = ({
  isVisible,
  onClose,
  responsesData,
  formSpec,
}) => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [activePrompt, setActivePrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(
    () => ollamaService.getConfig().modelName,
  );
  const [fetchingModels, setFetchingModels] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(
    null,
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messageListRef = useRef<HTMLDivElement>(null);
  const trueDataRef = useRef<string>("");
  const initialConnectionDone = useRef(false);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatHistory, isAnalyzing, streamingText]);

  const fetchModels = useCallback(async () => {
    setFetchingModels(true);
    const result = await ollamaService.fetchModels();
    if (result.success && result.models && result.models.length > 0) {
      setAvailableModels(result.models);
      const currentConfig = ollamaService.getConfig();
      const modelStillExists = result.models.some(
        (m) => m.name === currentConfig.modelName,
      );
      if (modelStillExists) {
        setSelectedModel(currentConfig.modelName);
      } else {
        setSelectedModel(result.models[0].name);
        ollamaService.setConfig({ modelName: result.models[0].name });
      }
    } else {
      setAvailableModels([]);
    }
    setFetchingModels(false);
  }, []);

  const testConnection = useCallback(
    async (showAlerts: boolean = false) => {
      setIsConnecting(true);
      const result = await ollamaService.testConnection();
      if (result.success) {
        if (showAlerts) {
          showMessage(t("responses.aiChat.connectedSuccess"), "success");
        }
        setConnectionStatus(true);
        fetchModels();
      } else {
        setConnectionStatus(false);
        if (showAlerts)
          showMessage(
            t("responses.aiChat.connectionFailed", {
              error: result.error || t("common.status.unknownError"),
            }),
            "error",
          );
      }
      setIsConnecting(false);
    },
    [fetchModels],
  );

  const handleSend = () => {
    if (!activePrompt.trim() || isAnalyzing) return;
    setChatHistory((prev) => [...prev, { sender: "user", text: activePrompt }]);
    setActivePrompt("");
  };

  useEffect(() => {
    if (isVisible && !initialConnectionDone.current) {
      trueDataRef.current = createAnalysisReport(responsesData, formSpec);
      setSelectedModel(ollamaService.getConfig().modelName);
      testConnection(false);
      initialConnectionDone.current = true;
    } else if (!isVisible) {
      initialConnectionDone.current = false;
      setChatHistory([]);
    }
  }, [isVisible, responsesData, formSpec, testConnection]);

  useEffect(() => {
    const shouldRun =
      (chatHistory.length === 0 && isVisible && connectionStatus) ||
      (chatHistory.length > 0 &&
        chatHistory[chatHistory.length - 1].sender === "user");

    if (!shouldRun) return;

    const performAnalysis = async () => {
      setIsAnalyzing(true);
      setStreamingText("");
      let completeResponse = "";

      try {
        await runAnalysis({
          chatHistory: chatHistory,
          trueData: trueDataRef.current,
          modelName: selectedModel,
          onData: (chunk: any) => {
            if (chunk.response) {
              const textChunk = chunk.response;
              completeResponse += textChunk;
              setStreamingText((prev) => prev + textChunk);
            }
          },
        });
        const finalMessage = { sender: "ai" as const, text: completeResponse };
        setChatHistory((prev) => [...prev, finalMessage]);
      } catch (e: any) {
        showMessage(e.message || t("responses.aiChat.analysisError"), "error");
        const errorMessage = {
          sender: "ai" as const,
          text: t("responses.aiChat.analysisErrorReply", {
            message: e.message || t("common.status.unknownError"),
          }),
        };
        setChatHistory((prev) => [...prev, errorMessage]);
      } finally {
        setIsAnalyzing(false);
        setStreamingText("");
      }
    };

    performAnalysis();
  }, [chatHistory, isVisible, connectionStatus, selectedModel]);

  const connectionButtonSx =
    connectionStatus === true
      ? {
          bgcolor: "#00796b",
          borderColor: "#00796b",
          color: "#fff",
          "&:hover": { bgcolor: "#004d40", borderColor: "#004d40" },
        }
      : connectionStatus === false
      ? {
          bgcolor: "#d32f2f",
          borderColor: "#d32f2f",
          color: "#fff",
          "&:hover": { bgcolor: "#c62828", borderColor: "#c62828" },
        }
      : {};

  if (!isVisible) return null;

  const controlsDisabled = !connectionStatus || isAnalyzing;

  return (
    <Box sx={{ width: "100%", mt: 1 }}>
      <Card variant="outlined">
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SmartToyOutlinedIcon /> {t("responses.aiChat.title")}
            </Box>
          }
          action={
            <IconButton aria-label="close" onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          }
        />
        <CardContent sx={{ pt: 0, pb: 0 }}>
          <Box
            ref={messageListRef}
            sx={{ height: 300, overflowY: "auto", pr: 1 }}
          >
            <List disablePadding>
              {chatHistory.map((item, index) => (
                <ListItem
                  key={index}
                  disableGutters
                  sx={{
                    display: "flex",
                    justifyContent:
                      item.sender === "user" ? "flex-end" : "flex-start",
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: "18px",
                      maxWidth: "80%",
                      bgcolor:
                        item.sender === "user" ? "primary.main" : "grey.100",
                      color: item.sender === "user" ? "#fff" : "inherit",
                      wordWrap: "break-word",
                    }}
                  >
                    <SafeMarkdown>{item.text}</SafeMarkdown>
                  </Box>
                </ListItem>
              ))}
            </List>
            {isAnalyzing && (
              <Box sx={{ display: "flex", mb: 1.5 }}>
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: "18px",
                    maxWidth: "80%",
                    bgcolor: "grey.100",
                    wordWrap: "break-word",
                  }}
                >
                  <SafeMarkdown>{streamingText}</SafeMarkdown>
                  <CircularProgress size={14} sx={{ ml: 1 }} />
                </Box>
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, mt: 1 }}>
            <TextField
              multiline
              minRows={1}
              maxRows={4}
              fullWidth
              size="small"
              value={activePrompt}
              onChange={(e) => setActivePrompt(e.target.value)}
              placeholder={t("responses.aiChat.askPlaceholder")}
              disabled={controlsDisabled}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isAnalyzing) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <IconButton
              color="primary"
              aria-label="send"
              onClick={handleSend}
              disabled={controlsDisabled || !activePrompt.trim()}
            >
              {isAnalyzing ? <CircularProgress size={20} /> : <SendIcon />}
            </IconButton>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              py: 1,
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                position: "relative",
                // Anchor the OllamaSettings accordion body above the footer so
                // it floats over the chat instead of pushing the footer down.
                "& .MuiCollapse-root": {
                  position: "absolute",
                  bottom: "calc(100%)",
                  left: 0,
                  right: 0,
                  minWidth: 400,
                  backgroundColor: "#ffffff",
                  border: "1px solid #f0f0f0",
                  zIndex: 10,
                  borderRadius: "8px",
                  boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
                },
              }}
            >
              <OllamaSettings />
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <ModelSelector
                model={selectedModel}
                setModel={(model) => {
                  setSelectedModel(model);
                  ollamaService.setConfig({ modelName: model });
                }}
                availableModels={availableModels}
                fetching={fetchingModels}
                disabled={!connectionStatus || fetchingModels}
                style={{ width: 180 }}
                placeholder={t("responses.aiChat.modelPlaceholder")}
              />
              <Button
                variant="outlined"
                onClick={() => testConnection(true)}
                disabled={isConnecting}
                startIcon={
                  isConnecting ? <CircularProgress size={16} /> : undefined
                }
                sx={connectionButtonSx}
              >
                {t("responses.aiChat.testConnection")}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AIAnalysisChat;
