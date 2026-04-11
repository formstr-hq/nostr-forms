import {
  Form,
  Typography,
  Steps,
  Button,
  Space,
  Progress,
  Card,
  Radio,
} from "antd";
import React, { useState, useEffect } from "react";
import { FormFields } from "./FormFields";
import { Field, Tag } from "../../nostr/types";
import FillerStyle from "./formFiller.style";
import FormBanner from "../../components/FormBanner";
import { IFormSettings } from "../CreateFormNew/components/FormSettings/types";
import { SectionData } from "../CreateFormNew/providers/FormBuilder/typeDefs";
import { Link } from "react-router-dom";
import { isMobile } from "../../utils/utility";
import { ReactComponent as CreatedUsingFormstr } from "../../Images/created-using-formstr.svg";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import SafeMarkdown from "../../components/SafeMarkdown";
import {
  AutoSaveIndicator,
  FormSettingsPopover,
} from "./components";
import type { SaveStatus } from "./components";
import { llmService, LLMProvider } from "../../services/llm";
import { OllamaModel, OllamaConfig } from "../../services/ollamaService";
import { getItem, setItem, LOCAL_STORAGE_KEYS } from "../../utils/localStorage";
import ModelSelector from "../../components/ModelSelector";
import { message as antMessage } from "antd";
import { AnswerTypes } from "../../constants";

const { Text, Title } = Typography;
const { Step } = Steps;

interface FormRendererProps {
  formTemplate: Tag[];
  form: any;
  onInput: (questionId: string, answer: string, message?: string) => void;
  footer?: React.ReactNode;
  hideTitleImage?: boolean;
  hideDescription?: boolean;
  disabled?: boolean;
  initialValues?: Record<string, any>;
  isPreview?: boolean;
  formstrBranding?: boolean;
  saveStatus?: SaveStatus;
  autoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
  formAuthorPubkey?: string;
  formEditKey?: string;
  responderSecretKey?: Uint8Array;
  uploaderPubkey?: string; // For decryption when viewing responses
}

// Content item can be either a section or individual questions
interface ContentItem {
  type: "section" | "questions";
  id: string;
  title: string;
  description?: string;
  fields: Field[];
  sectionData?: SectionData;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  formTemplate,
  form,
  onInput,
  footer,
  hideTitleImage,
  hideDescription,
  disabled = false,
  initialValues,
  formstrBranding,
  isPreview = false,
  saveStatus = "idle",
  autoSaveEnabled = true,
  onToggleAutoSave,
  formAuthorPubkey,
  formEditKey,
  responderSecretKey,
  uploaderPubkey,
}) => {
  const name = formTemplate.find((tag) => tag[0] === "name")?.[1] || "";
  const settings = JSON.parse(
    formTemplate.find((tag) => tag[0] === "settings")?.[1] || "{}",
  ) as IFormSettings;
  const fields = formTemplate.filter((tag) => tag[0] === "field") as Field[];

  // Section state management
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [provider, setProvider] = useState<LLMProvider>(
    getItem<LLMProvider>(LOCAL_STORAGE_KEYS.LLM_PROVIDER) || LLMProvider.OLLAMA
  );
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [config, setConfig] = useState<OllamaConfig>(llmService.activeService.getConfig?.() || { modelName: '' });
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isAIFilling, setIsAIFilling] = useState(false);

  const fetchModels = async () => {
    setFetchingModels(true);
    const result = await llmService.fetchModels();
    if (result.success && result.models) {
      const modelsWithCache = await Promise.all(result.models.map(async m => ({
        ...m,
        cached: provider === LLMProvider.WEB_LLM ? await (llmService.activeService as any).isModelCached(m.name) : false
      })));
      setAvailableModels(modelsWithCache);
    }
    setFetchingModels(false);
  };

  useEffect(() => {
    fetchModels();
  }, [provider]);

  const handleDownload = async () => {
    if (!config.modelName) return;
    setDownloading(true);
    setDownloadProgress(0);
    try {
      await (llmService.activeService as any).downloadModel(config.modelName, (p: string) => {
        const match = p.match(/(\d+)%/);
        if (match) setDownloadProgress(parseInt(match[1]));
      });
      antMessage.success('Model ready!');
      fetchModels();
    } catch (e: any) {
      antMessage.error(`Download failed: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!config.modelName) return;
    await (llmService.activeService as any).deleteModel(config.modelName);
    antMessage.success('Model deleted');
    fetchModels();
  };

  const handleAIFill = async () => {
    const personalInfo = getItem<string>(LOCAL_STORAGE_KEYS.AI_IDENTITY);
    if (!personalInfo) {
      antMessage.warning("Please set your personal info in the header first!");
      return;
    }
    if (!config.modelName) {
      antMessage.warning("Please select a model first");
      return;
    }


    console.log("Starting AI Autofill with personal info:", personalInfo);
    setIsAIFilling(true);
    try {
      for (const field of fields) {
        const [_, fieldId, type, label] = field;

        // Field type mapping based on constants/index.js
        const fillableTypes = [AnswerTypes.string, AnswerTypes.text, AnswerTypes.number, 'Email'];

        if (fillableTypes.includes(type as any)) {
          console.log(`--- Starting Field: ${label} (ID: ${fieldId}) ---`);
          let accumulatedAnswer = "";

          const prompt = `PERSONAL INFO: "${personalInfo}"\nQUESTION: "${label}"\nANSWER:`;

          const result = await llmService.generate({
            prompt: prompt,
            system: "You are a concise form filler. Use ONLY the provided personal info to answer the question. If the information is not present in the personal info, respond with 'N/A'. Do NOT invent any facts. Output ONLY the answer itself without any explanations, prefixes, or suffixes. If the answer is N/A, do NOT explain why.",
            modelName: config.modelName,
            stream: true
          }, (chunk: any) => {
            const token = typeof chunk === 'string' ? chunk : chunk?.response || "";
            if (token) {
              accumulatedAnswer += token;
              onInput(fieldId, accumulatedAnswer);
              form.setFieldsValue({ [fieldId]: [accumulatedAnswer, undefined] });
            }
          });

          console.log(`--- Finished Field: ${label}. Final Result: ${accumulatedAnswer} ---`);
          console.log("LLM Service Result Object:", result);
        } else {
          console.log(`Skipping non-fillable field: ${label} (Type: ${type})`);
        }
      }
      antMessage.success("Autofill complete!");
    } catch (err: any) {
      console.error("Autofill error:", err);
      antMessage.error(`Autofill failed: ${err.message}`);
    } finally {
      setIsAIFilling(false);
    }
  };


  const sections = settings.sections || [];
  const enableSections = !!sections.length;

  // Create mixed content flow
  const createContentFlow = (): ContentItem[] => {
    if (!enableSections) {
      return [
        {
          type: "questions",
          id: "all-questions",
          title: "Form Questions",
          fields: fields,
        },
      ];
    }

    const contentItems: ContentItem[] = [];
    const sectionedQuestionIds = new Set(
      sections.flatMap((section: SectionData) => section.questionIds),
    );

    // Get unsectioned questions that appear before any section
    const unsectionedFields = fields.filter(
      (field) => !sectionedQuestionIds.has(field[1]),
    );

    if (unsectionedFields.length > 0) {
      // Group unsectioned questions at the beginning
      contentItems.push({
        type: "questions",
        id: "unsectioned-questions",
        title: "General Questions",
        description: "Please answer these questions first",
        fields: unsectionedFields,
      });
    }

    // Add sections
    sections.forEach((section: SectionData) => {
      const sectionQuestionIds = new Set(section.questionIds);
      const sectionFields = fields.filter((field) =>
        sectionQuestionIds.has(field[1]),
      );

      if (sectionFields.length > 0) {
        contentItems.push({
          type: "section",
          id: section.id,
          title: section.title,
          description: section.description,
          fields: sectionFields,
          sectionData: section,
        });
      }
    });

    return contentItems;
  };

  const contentItems = createContentFlow();
  const currentItem = contentItems[currentStep];
  const isLastStep = currentStep >= contentItems.length - 1;
  const showStepper = enableSections && contentItems.length > 1;

  // Calculate progress
  const progress =
    ((currentStep + (completedSteps.has(currentStep) ? 1 : 0)) /
      contentItems.length) *
    100;

  // Validate current step
  const validateCurrentStep = async (): Promise<boolean> => {
    if (isPreview) {
      return true;
    }

    try {
      const fieldNames = currentItem?.fields.map((field) => field[1]) || [];
      await form.validateFields(fieldNames);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Navigation handlers
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = async (stepIndex: number) => {
    if (stepIndex < currentStep || completedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex);
    } else if (stepIndex === stepIndex + 1) {
      await handleNext();
    }
  };

  const renderAutoSaveControls = () => (
    <>
      <AutoSaveIndicator saveStatus={saveStatus} enabled={autoSaveEnabled} />
      {onToggleAutoSave && (
        <FormSettingsPopover
          autoSaveEnabled={autoSaveEnabled}
          onToggleAutoSave={onToggleAutoSave}
        />
      )}
    </>
  );

  // Footer with auto-save controls
  const renderFooterWithControls = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 12,
      }}
    >
      {renderAutoSaveControls()}
      {footer}
    </div>
  );

  const renderSteppedForm = () => (
    <div>
      {showStepper && (
        <div style={{ marginBottom: 24 }}>
          <Progress
            percent={Math.round(progress)}
            showInfo={false}
            strokeColor="#FF5733"
          />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Step {currentStep + 1} of {contentItems.length}
          </Text>
        </div>
      )}

      {showStepper && (
        <Steps
          current={currentStep}
          size="small"
          style={{ marginBottom: 32 }}
          direction={isMobile() ? "vertical" : "horizontal"}
        >
          {contentItems.map((item, index) => (
            <Step
              key={item.id}
              title={item.title}
              description={item.description}
              status={
                completedSteps.has(index)
                  ? "finish"
                  : index === currentStep
                    ? "process"
                    : "wait"
              }
              onClick={() => handleStepClick(index)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </Steps>
      )}

      {/* Current Step Content */}
      {currentItem && (
        <>
          {showStepper && (
            <Card style={{ marginBottom: 24 }}>
              <Title level={4}>{currentItem.title}</Title>
              {currentItem.description && (
                <Text type="secondary">
                  <SafeMarkdown>{currentItem.description}</SafeMarkdown>
                </Text>
              )}
              {currentItem.type === "questions" && (
                <Text
                  type="secondary"
                  style={{ display: "block", marginTop: 8 }}
                >
                  {currentItem.fields.length} question
                  {currentItem.fields.length !== 1 ? "s" : ""} in this step
                </Text>
              )}
            </Card>
          )}

          {/* Form Fields */}
          <FormFields
            fields={currentItem.fields}
            handleInput={onInput}
            disabled={disabled}
            values={initialValues}
            formSettings={settings}
            formAuthorPubkey={formAuthorPubkey}
            formEditKey={formEditKey}
            responderSecretKey={responderSecretKey}
            uploaderPubkey={uploaderPubkey}
          />
        </>
      )}

      {showStepper && (
        <Space
          style={{
            marginTop: 24,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={handleBack}
            disabled={currentStep === 0}
            icon={<LeftOutlined />}
          >
            Back
          </Button>

          {!isLastStep ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {renderAutoSaveControls()}
              <Button type="primary" onClick={handleNext}>
                Continue <RightOutlined />
              </Button>
            </div>
          ) : (
            renderFooterWithControls()
          )}
        </Space>
      )}

      {!showStepper && renderFooterWithControls()}

    </div>
  );

  return (
    <FillerStyle
      $bgImage={settings.backgroundImageUrl}
      $titleImageUrl={settings.titleImageUrl}
    >
      <div className="filler-container">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <Radio.Group
            value={provider}
            onChange={(e) => {
              const p = e.target.value;
              setProvider(p);
              setItem(LOCAL_STORAGE_KEYS.LLM_PROVIDER, p);
            }}
            buttonStyle="solid"
          >
            <Radio.Button value={LLMProvider.OLLAMA}>Ollama</Radio.Button>
            <Radio.Button value={LLMProvider.WEB_LLM}>WebLLM</Radio.Button>
          </Radio.Group>
        </div>
        <div className="ai-filler-controls" style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          alignItems: 'center',
          background: 'white',
          padding: '12px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <ModelSelector
            model={config.modelName}
            setModel={(m) => {
              const newCfg = { ...config, modelName: m };
              setConfig(newCfg);
              llmService.activeService.setConfig?.(newCfg);
            }}
            availableModels={availableModels}
            fetching={fetchingModels}
            disabled={isAIFilling || downloading}
            style={{ flex: 1, minWidth: '200px' }}
          />
          {provider === LLMProvider.WEB_LLM && (
            <>
              <Button
                onClick={handleDownload}
                loading={downloading}
                type="primary"
                danger
                style={{ borderRadius: '8px' }}
              >
                Download/Initialize
              </Button>
              <Button onClick={handleDelete} ghost danger style={{ borderRadius: '8px' }}>
                Delete
              </Button>
            </>
          )}
          <Button
            onClick={handleAIFill}
            loading={isAIFilling}
            disabled={downloading || !config.modelName}
            style={{
              borderRadius: '20px',
              padding: '0 24px',
              fontWeight: 'bold',
              background: 'white',
              border: '1px solid #ddd'
            }}
          >
            Fill with AI
          </Button>
        </div>
        {downloading && (
          <Progress percent={downloadProgress} status="active" style={{ marginBottom: '12px' }} />
        )}
        <div className="form-filler">
          {!hideTitleImage && (
            <FormBanner
              imageUrl={settings.titleImageUrl}
              formTitle={name}
              globalColor={settings.colors?.global ?? settings.globalColor}
              titleColor={settings.colors?.title}
            />
          )}
          {!hideDescription && settings?.description && (
            <div className="form-description">
              <Text style={{ color: settings.colors?.description ?? settings.colors?.global ?? settings.globalColor }}>
                <SafeMarkdown>{settings.description}</SafeMarkdown>
              </Text>
            </div>
          )}

          <Form form={form} onFinish={() => { }} className="with-description">
            {renderSteppedForm()}
          </Form>
        </div>

        {formstrBranding && (
          <div className="branding-container">
            <Link to="/">
              <CreatedUsingFormstr />
            </Link>
            {!isMobile() && (
              <a
                href="https://github.com/abhay-raizada/nostr-forms"
                className="foss-link"
              >
                <Text className="text-style">
                  Formstr is free and Open Source
                </Text>
              </a>
            )}
          </div>
        )}
      </div>
    </FillerStyle>
  );
};
