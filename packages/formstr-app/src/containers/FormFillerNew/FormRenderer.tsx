import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Step,
  StepButton,
  Stepper,
  Typography,
} from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useEffect, useRef, useState } from "react";
import { FormFields } from "./FormFields";
import { Field, Tag } from "../../nostr/types";
import FillerStyle from "./formFiller.style";
import FormBanner from "../../components/FormBanner";
import { IFormSettings } from "../CreateFormNew/components/FormSettings/types";
import { createContentFlow, stepClickAction } from "./utils/contentFlow";
import { Link } from "react-router-dom";
import { isMobile } from "../../utils/utility";
import { ReactComponent as CreatedUsingFormstr } from "../../Images/created-using-formstr.svg";
import SafeMarkdown from "../../components/SafeMarkdown";
import {
  AutoSaveIndicator,
  FormSettingsPopover,
  SaveStatus,
} from "./components";
import { useTranslation } from "react-i18next";
import { FieldErrors, FormValues, validateFields } from "./validations";

interface FormRendererProps {
  formTemplate: Tag[];
  /**
   * Legacy antd Form instance. Accepted for backward compatibility with
   * callers that still create one (CreateFormNew/EditForm/ResponsesNew) —
   * the renderer no longer uses it; state lives in `values`/`errors` (or the
   * internal fallback below).
   */
  form?: any;
  onInput: (questionId: string, answer: string, message?: string) => void;
  /**
   * Controlled field values ([answer, message] tuples). When omitted the
   * renderer self-manages values seeded from `initialValues` (preview and
   * read-only consumers don't need a container).
   */
  values?: FormValues;
  /** Controlled field errors; falls back to internal state when omitted. */
  errors?: FieldErrors;
  /**
   * External per-step validation hook. Receives the current step's fields,
   * returns true when they are valid (and is expected to update the
   * controlled `errors`). When omitted, the renderer validates internally.
   */
  onValidateFields?: (fields: Field[]) => boolean;
  /**
   * Reports the fields of each step as it renders (all steps at once in
   * read-only mode). Replicates antd's registered-fields semantics so the
   * container can build responses for every field the user has seen.
   */
  onFieldsRendered?: (fields: Field[]) => void;
  footer?: React.ReactNode;
  hideTitleImage?: boolean;
  hideDescription?: boolean;
  disabled?: boolean;
  /**
   * Renders a submitted form for viewing: keeps inputs non-interactive (implies
   * `disabled`) but styles them as plain text instead of greyed-out controls.
   */
  readOnly?: boolean;
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
  onClearForm?: () => void;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  formTemplate,
  onInput,
  values: valuesProp,
  errors: errorsProp,
  onValidateFields,
  onFieldsRendered,
  footer,
  hideTitleImage,
  hideDescription,
  disabled = false,
  readOnly = false,
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
  onClearForm,
}) => {
  const { t } = useTranslation();
  const name = formTemplate.find((tag) => tag[0] === "name")?.[1] || "";
  const settings = JSON.parse(
    formTemplate.find((tag) => tag[0] === "settings")?.[1] || "{}",
  ) as IFormSettings;
  const fields = formTemplate.filter((tag) => tag[0] === "field") as Field[];
  // Whether the description block renders above the questions. When it doesn't,
  // the questions wrapper needs its own top margin so the banner and the first
  // question don't butt right up against each other (the description's own
  // padding usually provides that gap).
  const showDescription = !hideDescription && !!settings?.description;

  // Values/errors: controlled when the parent passes them (the filler
  // container does), self-managed otherwise (previews, read-only views).
  const isControlled = valuesProp !== undefined;
  const [internalValues, setInternalValues] = useState<FormValues>(
    () => (initialValues as FormValues) ?? {},
  );
  const [internalErrors, setInternalErrors] = useState<FieldErrors>({});
  const values = valuesProp ?? internalValues;
  const errors = errorsProp ?? internalErrors;

  // Section state management
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const sections = settings.sections || [];
  const enableSections = !!sections.length;

  const contentItems = createContentFlow(fields, sections, t);
  const currentItem = contentItems[currentStep];
  const isLastStep = currentStep >= contentItems.length - 1;
  const showStepper = enableSections && contentItems.length > 1;

  // Calculate progress
  const progress =
    ((currentStep + (completedSteps.has(currentStep) ? 1 : 0)) /
      contentItems.length) *
    100;

  // Report rendered fields (antd registered-fields semantics): the fields of
  // each step as it is visited, or every field at once in read-only mode.
  const onFieldsRenderedRef = useRef(onFieldsRendered);
  onFieldsRenderedRef.current = onFieldsRendered;
  useEffect(() => {
    const report = onFieldsRenderedRef.current;
    if (!report) return;
    if (readOnly) {
      contentItems.forEach((item) => report(item.fields));
    } else if (currentItem) {
      report(currentItem.fields);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, readOnly, formTemplate]);

  const handleFieldInput = (
    questionId: string,
    answer: string,
    message?: string,
  ) => {
    if (!isControlled) {
      setInternalValues((prev) => ({
        ...prev,
        [questionId]:
          !answer || answer === ""
            ? null
            : ([answer, message] as [string, string | undefined]),
      }));
      setInternalErrors((prev) => {
        if (!(questionId in prev)) return prev;
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
    onInput(questionId, answer, message);
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    if (isPreview) {
      return true;
    }
    const stepFields = currentItem?.fields || [];
    if (onValidateFields) {
      return onValidateFields(stepFields);
    }
    const stepErrors = validateFields(stepFields, values);
    setInternalErrors((prev) => {
      const next = { ...prev };
      stepFields.forEach((field) => {
        const error = stepErrors[field[1]];
        if (error) next[field[1]] = error;
        else delete next[field[1]];
      });
      return next;
    });
    return Object.keys(stepErrors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    const isValid = validateCurrentStep();
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

  const handleStepClick = (stepIndex: number) => {
    const action = stepClickAction(stepIndex, currentStep, completedSteps);
    if (action === "jump") {
      setCurrentStep(stepIndex);
    } else if (action === "validate") {
      handleNext();
    }
  };

  const renderAutoSaveControls = () => (
    <>
      <AutoSaveIndicator saveStatus={saveStatus} enabled={autoSaveEnabled} />
      {(onToggleAutoSave || onClearForm) && (
        <FormSettingsPopover
          autoSaveEnabled={autoSaveEnabled}
          onToggleAutoSave={onToggleAutoSave || (() => {})}
          onClearForm={onClearForm}
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
        flexWrap: "wrap",
        gap: 12,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      {renderAutoSaveControls()}
      {footer}
    </div>
  );

  const renderFormFields = (itemFields: Field[]) => (
    <FormFields
      fields={itemFields}
      handleInput={handleFieldInput}
      disabled={disabled || readOnly}
      values={values}
      errors={errors}
      formSettings={settings}
      formAuthorPubkey={formAuthorPubkey}
      formEditKey={formEditKey}
      responderSecretKey={responderSecretKey}
      uploaderPubkey={uploaderPubkey}
    />
  );

  // Read-only view: render every section/question at once (no stepper), so a
  // submitted response can be read in full without clicking through steps.
  const renderReadOnlyForm = () => (
    <div>
      {contentItems.map((item) => (
        <div key={item.id}>
          {enableSections && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                <Typography variant="h6" component="h3">
                  {item.title}
                </Typography>
                {item.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="div"
                  >
                    <SafeMarkdown>{item.description}</SafeMarkdown>
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
          {renderFormFields(item.fields)}
        </div>
      ))}
    </div>
  );

  const renderSteppedForm = () => (
    <div>
      {showStepper && (
        <Box sx={{ mb: 3 }} className="section-progress">
          <LinearProgress
            variant="determinate"
            value={Math.round(progress)}
            sx={{ mb: 0.5 }}
          />
          <Typography variant="caption" color="text.secondary">
            {t("common.labels.step", {
              current: currentStep + 1,
              total: contentItems.length,
            })}
          </Typography>
        </Box>
      )}

      {showStepper && (
        <Stepper
          activeStep={currentStep}
          nonLinear
          orientation={isMobile() ? "vertical" : "horizontal"}
          className="section-steps"
          sx={{ mb: 4 }}
        >
          {contentItems.map((item, index) => (
            <Step key={item.id} completed={completedSteps.has(index)}>
              <StepButton onClick={() => handleStepClick(index)}>
                {item.title}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Current Step Content */}
      {currentItem && (
        <>
          {showStepper && (
            <Card variant="outlined" className="section-header" sx={{ mb: 3 }}>
              <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {currentItem.title}
                </Typography>
                {currentItem.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="div"
                  >
                    <SafeMarkdown>{currentItem.description}</SafeMarkdown>
                  </Typography>
                )}
                {currentItem.type === "questions" && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    {t("common.labels.questionsInStep", {
                      count: currentItem.fields.length,
                    })}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Form Fields */}
          {renderFormFields(currentItem.fields)}
        </>
      )}

      {showStepper && (
        <Box
          className="section-navigation"
          sx={{
            mt: 3,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={currentStep === 0}
            startIcon={<KeyboardArrowLeftIcon />}
          >
            {t("common.actions.back")}
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
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<KeyboardArrowRightIcon />}
              >
                {t("common.actions.continue")}
              </Button>
            </div>
          ) : (
            renderFooterWithControls()
          )}
        </Box>
      )}

      {!showStepper && renderFooterWithControls()}
    </div>
  );

  return (
    <FillerStyle
      $bgImage={settings.backgroundImageUrl}
      $titleImageUrl={settings.titleImageUrl}
      $readOnly={readOnly}
    >
      <div className="filler-container">
        <div className="form-filler">
          {!hideTitleImage && (
            <FormBanner
              imageUrl={settings.titleImageUrl}
              formTitle={name}
              globalColor={settings.colors?.global ?? settings.globalColor}
              titleColor={settings.colors?.title}
            />
          )}
          {showDescription && (
            <div className="form-description">
              <Typography
                component="div"
                sx={{
                  color:
                    settings.colors?.description ??
                    settings.colors?.global ??
                    settings.globalColor,
                }}
              >
                <SafeMarkdown>{settings.description}</SafeMarkdown>
              </Typography>
            </div>
          )}

          <div className={showDescription ? "with-description" : "hidden-description"}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {readOnly ? renderReadOnlyForm() : renderSteppedForm()}
            </LocalizationProvider>
          </div>
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
                <Typography className="text-style">
                  {t("filler.branding")}
                </Typography>
              </a>
            )}
          </div>
        )}
      </div>
    </FillerStyle>
  );
};
