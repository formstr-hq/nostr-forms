import { Box, Card, CardContent, Divider, FormHelperText } from "@mui/material";
import { InputFiller } from "./InputFiller";
import { AnswerTypes } from "../../../constants";
import SafeMarkdown from "../../../components/SafeMarkdown";
import { IFormSettings } from "../../CreateFormNew/components/FormSettings/types";
import { GridOptions, Option } from "../../../nostr/types";
import { FORMSTR_COLORS } from "../../../theme/muiTheme";
import { FormFieldValue } from "../validations";

interface QuestionProps {
  label: string;
  fieldConfig: any;
  fieldId: string;
  options: Option[];
  inputHandler: (questionId: string, answer: string, message?: string) => void;
  required: boolean;
  disabled?: boolean;
  value?: FormFieldValue;
  error?: string;
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
  error,
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

  return (
    <Card
      variant="outlined"
      className="filler-question"
      data-testid={`${testId}:card`}
      sx={{
        mb: 2,
        backgroundColor: `rgba(255, 255, 255,${formSettings.cardTransparency})`,
        color:
          formSettings.colors?.question ??
          formSettings.colors?.global ??
          formSettings.globalColor ??
          "black",
      }}
    >
      <CardContent sx={{ "&:last-child": { pb: 2 } }}>
        <Box
          className="question-text"
          sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}
        >
          {required && (
            <Box
              component="span"
              sx={{ color: FORMSTR_COLORS.primary, fontWeight: 700 }}
            >
              *
            </Box>
          )}
          <SafeMarkdown>{label}</SafeMarkdown>
        </Box>
        {fieldConfig.renderElement === AnswerTypes.label ? null : (
          <Divider sx={{ mt: 0, mb: 3 }} />
        )}
        <InputFiller
          fieldConfig={fieldConfig}
          options={options}
          onChange={answerHandler(fieldId)}
          disabled={disabled}
          defaultValue={value ? value[0] : undefined}
          defaultMessage={value ? value[1] : undefined}
          testId={`${testId}:input`}
          gridOptions={gridOptions}
          formAuthorPubkey={formAuthorPubkey}
          formEditKey={formEditKey}
          responderSecretKey={responderSecretKey}
          uploaderPubkey={uploaderPubkey}
        />
        {error && (
          <FormHelperText error role="alert" sx={{ mt: 1, mx: 0 }}>
            {error}
          </FormHelperText>
        )}
      </CardContent>
    </Card>
  );
};
