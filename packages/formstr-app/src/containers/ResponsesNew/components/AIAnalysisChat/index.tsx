import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Card,
  Input,
  List,
  Popover,
  Space,
  Spin,
  message,
} from "antd";
import {
  CloseOutlined,
  InfoCircleOutlined,
  RobotOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { AIAnalysisChatProps, Message } from "./types";
import { ChatWrapper, MessageItem, MessageList } from "./style";
import { ollamaService, OllamaModel } from "../../../../services/ollamaService";
import ModelSelector from "../../../../components/ModelSelector";
import OllamaSettings from "../../../../components/OllamaSettings";
import { createAnalysisReport, runAnalysis } from "./analysisHelper";
import SafeMarkdown from "../../../../components/SafeMarkdown";

const { TextArea } = Input;

const AIAnalysisChat: React.FC<AIAnalysisChatProps> = ({
  isVisible,
  onClose,
  responsesData,
  formSpec,
}) => {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [activePrompt, setActivePrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(
    () => ollamaService.getConfig().modelName
  );
  const [fetchingModels, setFetchingModels] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(
    null
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
        (m) => m.name === currentConfig.modelName
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
        if (showAlerts) message.success("Successfully connected to Ollama!");
        setConnectionStatus(true);
        fetchModels();
      } else {
        setConnectionStatus(false);
        if (showAlerts)
          message.error(
            `Connection failed: ${result.error || "Unknown error"}`
          );
      }
      setIsConnecting(false);
    },
    [fetchModels]
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
        message.error(e.message || "An error occurred during analysis.");
        const errorMessage = {
          sender: "ai" as const,
          text: `Sorry, an error occurred: ${e.message}`,
        };
        setChatHistory((prev) => [...prev, errorMessage]);
      } finally {
        setIsAnalyzing(false);
        setStreamingText("");
      }
    };

    performAnalysis();
  }, [chatHistory, isVisible, connectionStatus, selectedModel]);

  const getButtonProps = () => {
    if (connectionStatus === true)
      return { className: "ai-chat-button-success" };
    if (connectionStatus === false)
      return { className: "ai-chat-button-danger" };
    return {};
  };

  if (!isVisible) return null;

  const controlsDisabled = !connectionStatus || isAnalyzing;

  return (
    <ChatWrapper>
      <Card
        title={
          <Space>
            <RobotOutlined /> AI Analysis
          </Space>
        }
        extra={
          <Space size={4}>
            <Popover
              trigger="click"
              placement="bottomRight"
              overlayInnerStyle={{ maxHeight: "70vh", overflowY: "auto" }}
              content={<OllamaSettings mode="content" />}
            >
              <Button
                type="text"
                icon={<InfoCircleOutlined />}
                aria-label="Connection Help & Instructions"
              />
            </Popover>
            <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
          </Space>
        }
        bodyStyle={{ paddingTop: 4, paddingBottom: 0 }}
      >
        <MessageList ref={messageListRef}>
          <List
            dataSource={chatHistory}
            renderItem={(item) => (
              <MessageItem sender={item.sender}>
                <div className="message-bubble">
                  <SafeMarkdown>{item.text}</SafeMarkdown>
                </div>
              </MessageItem>
            )}
          />
          {isAnalyzing && (
            <MessageItem sender="ai">
              <div className="message-bubble">
                <SafeMarkdown>{streamingText}</SafeMarkdown>
                <Spin size="small" style={{ marginLeft: "8px" }} />
              </div>
            </MessageItem>
          )}
        </MessageList>
        <div style={{ marginTop: "auto" }}>
          <Space.Compact style={{ width: "100%" }}>
            <TextArea
              value={activePrompt}
              onChange={(e) => setActivePrompt(e.target.value)}
              placeholder="Ask about the responses..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={controlsDisabled}
              onPressEnter={(e) => {
                if (!e.shiftKey && !isAnalyzing) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={isAnalyzing}
              disabled={controlsDisabled || !activePrompt.trim()}
            />
          </Space.Compact>
        </div>
        <div className="chat-footer-controls">
          <Space>
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
              placeholder="Select model"
            />
            <Button
              onClick={() => testConnection(true)}
              loading={isConnecting}
              {...getButtonProps()}
            >
              Test Connection
            </Button>
          </Space>
        </div>
      </Card>
    </ChatWrapper>
  );
};

export default AIAnalysisChat;
