import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Radio, TextField } from "@mui/material";
import { useState } from "react";
import { AddOption } from "./AddOption";
import {
  handleDelete,
  handleLabelChange,
  hasOtherOption,
  normalizeChoices,
} from "./utils";
import { Choice, ChoiceSettings } from "./types";
import { ColorfulMarkdownTextarea } from "../../../../../../components/SafeMarkdown/ColorfulMarkdownInput";
import { useTranslation } from "react-i18next";

interface RadioButtonCreatorProps {
  initialValues?: Array<Choice>;
  onValuesChange: (options: Choice[]) => void;
}

export const RadioButtonCreator: React.FC<RadioButtonCreatorProps> = ({
  initialValues,
  onValuesChange,
}) => {
  const { t } = useTranslation();
  const [choices, setChoices] = useState<Array<Choice>>(() =>
    normalizeChoices(initialValues),
  );

  const handleNewChoices = (choices: Array<Choice>) => {
    setChoices(choices);
    onValuesChange(choices);
  };

  return (
    <Box>
      {choices?.map((choice) => {
        let [choiceId, label, settingsString] = choice;
        let settings = JSON.parse(settingsString || "{}") as ChoiceSettings;
        return (
          <Box
            key={choiceId}
            sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
          >
            <Radio disabled key={choiceId + "choice"} />
            <Box sx={{ m: "10px", flex: 1 }}>
              <ColorfulMarkdownTextarea
                key={choiceId + "input"}
                onChange={(val) => {
                  handleLabelChange(val, choiceId!, choices, handleNewChoices);
                }}
                value={label}
                placeholder={t("builder.inputPreviews.optionPlaceholder")}
                disabled={settings.isOther}
              />
            </Box>
            {settings.isOther && (
              <TextField
                placeholder={t("builder.inputPreviews.customRespondentAnswer")}
                disabled
                size="small"
                variant="standard"
                slotProps={{ input: { disableUnderline: true } }}
                sx={{ maxWidth: 200, m: "10px" }}
              />
            )}
            {choices.length >= 2 && (
              <IconButton
                size="small"
                onClick={() => {
                  handleDelete(choiceId!, choices, handleNewChoices);
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        );
      })}
      <AddOption
        disable={choices.some((choice) => {
          let [choiceId, label, settingsString] = choice;
          return label === "";
        })}
        choices={choices}
        callback={handleNewChoices}
        displayOther={!hasOtherOption(choices)}
      />
    </Box>
  );
};
