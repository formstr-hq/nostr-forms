import {
  Box,
  Card,
  CardContent,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import CardHeader from "./CardHeader";
import Inputs from "./Inputs";
import { Choice } from "./InputElements/OptionTypes/types";
import { normalizeChoices } from "./InputElements/OptionTypes/utils";
import UploadFile from "./UploadFile";
import { AnswerSettings, AnswerTypes, Field } from "../../../../nostr/types";
import { ColorfulMarkdownTextarea } from "../../../../components/SafeMarkdown/ColorfulMarkdownInput";
import { useTranslation } from "react-i18next";

type QuestionCardProps = {
  question: Field;
  onEdit: (question: Field, tempId: string) => void;
  onReorderKey: (keyType: "UP" | "DOWN", tempId: string) => void;
  firstQuestion: boolean;
  lastQuestion: boolean;
};

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onEdit,
  onReorderKey,
  firstQuestion,
  lastQuestion,
}) => {
  const { t } = useTranslation();
  const answerSettings = JSON.parse(
    question[5] || '{"renderElement": "shortText"}',
  );

  // Parse options based on question type
  let options: Array<Choice>;
  if (
    answerSettings.renderElement === AnswerTypes.multipleChoiceGrid ||
    answerSettings.renderElement === AnswerTypes.checkboxGrid
  ) {
    // For grid questions, parse as GridOptions or use default
    try {
      const parsed = JSON.parse(question[4] || '{"columns":[],"rows":[]}');
      // If it's already GridOptions format, use it; otherwise treat as empty grid
      options = parsed as any; // Will be cast properly in Inputs.tsx
    } catch {
      options = { columns: [], rows: [] } as any;
    }
  } else {
    try {
      const parsed = JSON.parse(question[4] || "[]");
      options = normalizeChoices(parsed);
    } catch {
      options = [];
    }
  }
  const {
    questionIdInFocus,
    setQuestionIdInFocus,
    sections,
    getSectionForQuestion,
    moveQuestionToSection,
    formSettings,
  } = useFormBuilderContext();

  const isSelected = questionIdInFocus === question[1];

  const currentSectionId = getSectionForQuestion(question[1]);

  const handleTextChange = (value: string) => {
    let field = question;
    field[3] = value;
    onEdit(field, question[1]);
  };

  const handleRequiredChange = (required: boolean) => {
    let newAnswerSettings = { ...answerSettings, required };
    let field = question;
    field[5] = JSON.stringify(newAnswerSettings);
    onEdit(field, question[1]);
  };

  const onCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuestionIdInFocus(question[1]);
  };

  const handleAnswerSettings = (newAnswerSettings: AnswerSettings) => {
    let field = question;
    field[5] = JSON.stringify(newAnswerSettings);
    onEdit(field, question[1]);
  };

  const handleOptions = (newOptions: Choice[]) => {
    let field = question;
    field[4] = JSON.stringify(newOptions);
    onEdit(field, question[1]);
  };

  const handleSectionChange = (sectionId: string) => {
    if (sectionId === "unsectioned") {
      moveQuestionToSection(question[1], undefined);
    } else {
      moveQuestionToSection(question[1], sectionId);
    }
  };

  return (
    <Card
      variant="outlined"
      className="question-card"
      onClick={onCardClick}
      sx={{
        maxWidth: "100%",
        m: "10px",
        textAlign: "left",
        backgroundColor: `rgba(255, 255, 255,${formSettings.cardTransparency})`,
        // Selected state (docs/ui-rewrite §3): orange ring + left accent bar.
        transition: "box-shadow 0.15s, border-color 0.15s",
        borderColor: isSelected ? "primary.main" : undefined,
        borderLeft: isSelected ? "3px solid" : undefined,
        borderLeftColor: isSelected ? "primary.main" : undefined,
        boxShadow: isSelected
          ? (theme) => `0 0 0 1px ${theme.palette.primary.main}`
          : "none",
      }}
    >
      <CardContent sx={{ pt: "7px" }}>
        <CardHeader
          required={answerSettings.required}
          onRequired={handleRequiredChange}
          question={question}
          onReorderKey={onReorderKey}
          firstQuestion={firstQuestion}
          lastQuestion={lastQuestion}
        />

        {!!sections.length && (
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t("builder.questionCard.section")}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={currentSectionId || "unsectioned"}
                onChange={(e) => handleSectionChange(e.target.value)}
                displayEmpty
                inputProps={{ "aria-label": t("builder.chooseSection") }}
              >
                <MenuItem value="unsectioned">
                  {t("builder.questionCard.unsectioned")}
                </MenuItem>
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.title || t("builder.questionCard.untitledSection")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        <Box
          className="question-text"
          sx={{
            justifyContent: "space-between",
            display: "flex",
            mb: "10px",
            lineHeight: 2,
            cursor: "pointer",
            "&:focus-visible": {
              outline: "none",
              borderBottom: "0.5px solid",
            },
          }}
        >
          <label style={{ width: "100%" }}>
            <ColorfulMarkdownTextarea
              key={question[1]}
              value={question[3] || ""}
              onChange={handleTextChange}
              placeholder={t("builder.enterQuestion")}
              color={
                formSettings.colors?.question ??
                formSettings.colors?.global ??
                formSettings.globalColor
              }
            />
          </label>
          <UploadFile
            onImageUpload={(markdownUrl) => {
              const currentDisplay = question[3] || "";
              const newDisplay = currentDisplay
                ? `${currentDisplay}\n\n${markdownUrl}`
                : markdownUrl;

              const field: Field = [
                question[0],
                question[1],
                question[2],
                newDisplay,
                question[4],
                question[5],
              ];

              onEdit(field, field[1]);
            }}
          />
        </Box>

        <Inputs
          inputType={answerSettings.renderElement}
          options={options}
          answerSettings={answerSettings}
          answerSettingsHandler={handleAnswerSettings}
          optionsHandler={handleOptions}
        />
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
