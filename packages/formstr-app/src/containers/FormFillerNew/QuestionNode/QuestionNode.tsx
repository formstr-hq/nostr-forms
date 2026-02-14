import { Card, Divider } from "antd";
import { InputFiller } from "./InputFiller";
import { AnswerTypes } from "../../../constants";
import SafeMarkdown from "../../../components/SafeMarkdown";
import { IFormSettings } from "../../CreateFormNew/components/FormSettings/types";
import { GridOptions, Option } from "../../../nostr/types";
import Settings from "../../CreateFormNew/components/Settings";

interface QuestionProps {
  label: string;
  fieldConfig: any;
  fieldId: string;
  options: Option[];
  inputHandler: (questionId: string, answer: string, message?: string) => void;
  required: boolean;
  disabled?: boolean;
  value?: any;
  testId: string;
  formSettings: IFormSettings;
  gridOptions?: GridOptions | null;
  formAuthorPubkey?: string;
  formEditKey?: string;
  responderSecretKey?: Uint8Array;
  uploaderPubkey?: string;
}

export const QuestionNode: React.FC<QuestionProps> = ({
  label,
  fieldConfig,
  fieldId,
  options,
  inputHandler,
  required,
  disabled = false,
  value,
  testId,
  formSettings,
  gridOptions,
  formAuthorPubkey,
  formEditKey,
  responderSecretKey,
  uploaderPubkey,
}) => {
  const answerHandler = (questionId: string) => {
    return (answer: string, message?: string) => {
      return inputHandler(questionId, answer, message);
    };
  };
  console.log("options", options, fieldConfig);

  return (
    <Card
      type="inner"
      className="filler-question"
      data-testid={`${testId}:card`}
      style={{
        backgroundColor: `rgba(255, 255, 255,${formSettings.cardTransparency})`, // 0.5 is opacity
        color: formSettings.globalColor || "black",
      }}
    >
      {required && <span style={{ color: "#ea8dea" }}>* &nbsp;</span>}
      <div className="question-text">
        <SafeMarkdown>{label}</SafeMarkdown>
      </div>
      {fieldConfig.renderElement === AnswerTypes.label ? null : (
        <Divider style={{ marginTop: 0, marginBottom: 24 }} />
      )}
      <InputFiller
        fieldConfig={fieldConfig}
        options={options}
        onChange={answerHandler(fieldId)}
        disabled={disabled}
        defaultValue={value ? value[0] : undefined}
        testId={`${testId}:input`}
        gridOptions={gridOptions}
        formAuthorPubkey={formAuthorPubkey}
        formEditKey={formEditKey}
        responderSecretKey={responderSecretKey}
        uploaderPubkey={uploaderPubkey}
      />
    </Card>
  );
};
