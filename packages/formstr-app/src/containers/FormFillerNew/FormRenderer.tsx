import {
  Form,
  Typography,
  Steps,
  Button,
  Space,
  Progress,
  Card,
} from "antd";
import { useState } from "react";
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
  SaveStatus,
} from "./components";

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
}) => {
  const name = formTemplate.find((tag) => tag[0] === "name")?.[1] || "";
  const settings = JSON.parse(
    formTemplate.find((tag) => tag[0] === "settings")?.[1] || "{}",
  ) as IFormSettings;
  const fields = formTemplate.filter((tag) => tag[0] === "field") as Field[];

  // Section state management
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());


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
      <AutoSaveIndicator saveStatus={saveStatus} enabled={autoSaveEnabled} />
      {onToggleAutoSave && (
        <FormSettingsPopover
          autoSaveEnabled={autoSaveEnabled}
          onToggleAutoSave={onToggleAutoSave}
        />
      )}
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
            <Button type="primary" onClick={handleNext}>
              Continue <RightOutlined />
            </Button>
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
        <div className="form-filler">
          {!hideTitleImage && (
            <FormBanner
              imageUrl={settings.titleImageUrl}
              formTitle={name}
              globalColor={settings.globalColor}
            />
          )}
          {!hideDescription && settings?.description && (
            <div className="form-description">
              <Text style={{ color: settings.globalColor }}>
                <SafeMarkdown>{settings.description}</SafeMarkdown>
              </Text>
            </div>
          )}

          <Form form={form} onFinish={() => {}} className="with-description">
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
