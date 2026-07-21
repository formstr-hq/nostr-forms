import { Box, Tooltip, Typography } from "@mui/material";
import { InputFiller } from "../../../FormFillerNew/QuestionNode/InputFiller";
import {
  AnswerSettings,
  AnswerTypes,
  GridOptions,
} from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

interface RightAnswerProps {
  answerType: AnswerTypes;
  answerSettings: AnswerSettings;
  choices?: string;
  onChange: (answer: string | string[]) => void;
}

const rightAnswerSx = {
  display: "flex",
  flexDirection: "column",
  m: "10px",
  maxWidth: "100%",
  height: "auto",
};

export const RightAnswer: React.FC<RightAnswerProps> = ({
  answerType,
  answerSettings,
  choices,
  onChange,
}) => {
  const { t } = useTranslation();
  // Parse choices - only for option-based questions
  let parsedChoices = [];
  try {
    const parsed = JSON.parse(choices || "[]");
    if (Array.isArray(parsed)) {
      parsedChoices = parsed;
    }
  } catch {
    parsedChoices = [];
  }
  // Handle grid questions
  if (
    answerType === AnswerTypes.multipleChoiceGrid ||
    answerType === AnswerTypes.checkboxGrid
  ) {
    let gridOptions: GridOptions;
    try {
      gridOptions = JSON.parse(choices || '{"columns":[],"rows":[]}');
    } catch {
      gridOptions = { columns: [], rows: [] };
    }

    return (
      <Tooltip title={t("builder.rightAnswer.gridTooltip")}>
        <Box sx={rightAnswerSx}>
          <Typography variant="body2" color="text.secondary">
            {t("builder.rightAnswer.label_other")}
          </Typography>
          <InputFiller
            defaultValue={answerSettings?.validationRules?.match?.answer}
            options={parsedChoices}
            gridOptions={gridOptions}
            fieldConfig={answerSettings}
            onChange={onChange}
          />
        </Box>
      </Tooltip>
    );
  }

  const processedAnswerSettings = {
    ...answerSettings,
    choices: parsedChoices.map(([choiceId, label]: [string, string]) => ({
      choiceId,
      label,
    })),
  };

  const isMultipleChoice = answerType === AnswerTypes.checkboxes;

  return (
    <Tooltip
      title={t(
        isMultipleChoice
          ? "builder.rightAnswer.tooltip_other"
          : "builder.rightAnswer.tooltip_one",
      )}
    >
      <Box sx={rightAnswerSx}>
        <Typography variant="body2" color="text.secondary">
          {t(
            isMultipleChoice
              ? "builder.rightAnswer.label_other"
              : "builder.rightAnswer.label_one",
          )}
        </Typography>
        <InputFiller
          defaultValue={answerSettings?.validationRules?.match?.answer}
          options={parsedChoices}
          fieldConfig={processedAnswerSettings}
          onChange={onChange}
        />
      </Box>
    </Tooltip>
  );
};

export default RightAnswer;
