import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Switch,
  Typography,
} from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useTranslation } from "react-i18next";
import Validation from "../Validation";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { getInputsMenu } from "../../configs/menuConfig";
import { RightAnswer } from "./RightAnswer";
import { IAnswerSettings } from "./types";
import { AnswerTypes, Field } from "../../../../nostr/types";
import { SignatureSettings } from "./settings/SignatureSettings";
import { FileUploadSettings } from "./settings/FileUploadSettings";
import { RatingSettings } from "./settings/RatingSettings";

const propertySettingSx = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  my: 1.5,
  fontSize: 14,
};

function AnswerSettings() {
  const { t } = useTranslation();
  const { questionsList, questionIdInFocus, editQuestion, deleteQuestion } =
    useFormBuilderContext();
  const [typeAnchor, setTypeAnchor] = useState<HTMLElement | null>(null);
  const inputsMenu = getInputsMenu(t);

  if (!questionIdInFocus) {
    return null;
  }
  const questionIndex = questionsList.findIndex(
    (field: Field) => field[1] === questionIdInFocus,
  );
  if (questionIndex === -1) {
    return null;
  }
  const question = questionsList[questionIndex];
  const answerSettings = JSON.parse(
    question[5] || '{ "renderElement": "shortText"}',
  );

  const answerType = inputsMenu.find(
    (option) =>
      option.answerSettings.renderElement === answerSettings.renderElement,
  );

  const handleRightAnswer = (rightAnswer: string | string[]) => {
    const field = question;
    let newAnswerSettings = {
      ...answerSettings,
      validationRules: {
        ...answerSettings.validationRules,
        match: { answer: rightAnswer },
      },
    };
    field[5] = JSON.stringify(newAnswerSettings);
    editQuestion(field, field[1]);
  };

  const renderExtraSettings = () => {
    switch (answerSettings.renderElement) {
      case AnswerTypes.signature:
        return (
          <SignatureSettings
            answerSettings={answerSettings}
            handleAnswerSettings={handleAnswerSettings}
          />
        );
      case AnswerTypes.fileUpload:
        return (
          <FileUploadSettings
            answerSettings={answerSettings}
            handleAnswerSettings={handleAnswerSettings}
          />
        );
      case AnswerTypes.rating:
        return (
          <RatingSettings
            answerSettings={answerSettings}
            handleAnswerSettings={handleAnswerSettings}
          />
        );
      // other case blocks like:
      // case AnswerTypes.shortText: return <ShortTextSettings ... />
      default:
        return null;
    }
  };

  const updateAnswerType = (key: string) => {
    const selectedItem = inputsMenu.find((item) => item.key === key);
    setTypeAnchor(null);
    if (!selectedItem) return;
    let field = question;
    field[2] = selectedItem.primitive;
    let newAnswerSettings = selectedItem.answerSettings;
    field[5] = JSON.stringify(newAnswerSettings);
    editQuestion(field, field[1]);
  };

  const updateIsRequired = (checked: boolean) => {
    let field = question;
    let newAnswerSettings = { ...answerSettings, required: checked };
    field[5] = JSON.stringify(newAnswerSettings);
    editQuestion(field, question[1]);
  };

  const handleAnswerSettings = (newAnswerSettings: IAnswerSettings) => {
    let changedSettings = { ...answerSettings, ...newAnswerSettings };
    let field = question;
    field[5] = JSON.stringify(changedSettings);
    editQuestion(field, field[1]);
  };

  return (
    <Box>
      <Typography sx={{ display: "block", m: 2 }}>
        {t("builder.properties.questionCounter", {
          current: questionIndex + 1,
          total: questionsList.length,
        })}
      </Typography>
      <Divider />
      <Box sx={{ m: 2 }}>
        <Typography sx={{ display: "block", my: 1.5 }}>
          {t("builder.properties.title")}
        </Typography>
        <Box sx={propertySettingSx}>
          <Typography variant="body2" color="text.secondary">
            {t("builder.properties.type")}
          </Typography>
          <Button
            variant="text"
            color="inherit"
            size="small"
            endIcon={<KeyboardArrowDownIcon />}
            onClick={(e) => setTypeAnchor(e.currentTarget)}
          >
            {answerType?.label}
          </Button>
          <Menu
            anchorEl={typeAnchor}
            open={Boolean(typeAnchor)}
            onClose={() => setTypeAnchor(null)}
          >
            {inputsMenu.map((item) => (
              <MenuItem
                key={item.key}
                onClick={() => updateAnswerType(item.key)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText>{item.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </Box>
        {answerType && (
          <Box sx={propertySettingSx}>
            <Typography variant="body2" color="text.secondary">
              {t("builder.properties.required")}
            </Typography>
            <Switch
              checked={!!answerSettings.required}
              onChange={(_e, checked) => updateIsRequired(checked)}
            />
          </Box>
        )}
      </Box>
      <Divider />

      <Validation
        key={question[1] + "validation"}
        answerType={answerSettings.renderElement}
        answerSettings={answerSettings}
        handleAnswerSettings={handleAnswerSettings}
      />
      <Divider />
      {answerType && (
        <RightAnswer
          key={question[1] + "rightAnswer"}
          answerType={answerSettings.renderElement}
          answerSettings={answerSettings}
          choices={question[4]}
          onChange={handleRightAnswer}
        />
      )}
      <Divider />
      <Box sx={{ m: 2 }}>{renderExtraSettings()}</Box>
      <Divider sx={{ my: 3 }} />
      <Button
        color="error"
        variant="text"
        startIcon={<DeleteOutlinedIcon />}
        onClick={() => deleteQuestion(question[1])}
        sx={{ m: "12px 16px", p: 0, lineHeight: "16px", height: 20 }}
      >
        {t("common.actions.delete")}
      </Button>
      <Divider />
    </Box>
  );
}

export default AnswerSettings;
