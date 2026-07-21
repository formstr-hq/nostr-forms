import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material";
import { useRef, useState } from "react";
import { AddOption } from "./AddOption";
import { handleDelete, handleLabelChange, normalizeChoices } from "./utils";
import { Choice, ChoiceSettings } from "./types";
import { useTranslation } from "react-i18next";

interface RadioButtonCreatorProps {
  initialValues?: Array<Choice>;
  onValuesChange: (options: Choice[]) => void;
}

export const DropdownCreator: React.FC<RadioButtonCreatorProps> = ({
  initialValues,
  onValuesChange,
}) => {
  const { t } = useTranslation();
  const [choices, setChoices] = useState<Array<Choice>>(() =>
    normalizeChoices(initialValues),
  );
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = Boolean(anchorEl);

  const handleNewChoices = (choices: Array<Choice>) => {
    setChoices(choices);
    onValuesChange(choices);
    // Keep the dropdown open after edits/additions (antd setIsOpen(true)).
    setAnchorEl(triggerRef.current);
  };

  return (
    <Box>
      <Button
        ref={triggerRef}
        variant="outlined"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<ArrowDropDownIcon />}
        sx={{ mt: "5px", mb: "10px" }}
      >
        {t("builder.inputPreviews.optionsCount", { count: choices.length })}
      </Button>
      <Menu anchorEl={anchorEl} open={isOpen} onClose={() => setAnchorEl(null)}>
        {choices.map((choice) => {
          let [choiceId, label, settingsString] = choice;
          let settings = JSON.parse(settingsString || "{}") as ChoiceSettings;
          return (
            <MenuItem
              key={choiceId}
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <TextField
                defaultValue={label}
                key={choiceId}
                onChange={(e) => {
                  handleLabelChange(
                    e.target.value,
                    choiceId!,
                    choices,
                    handleNewChoices,
                  );
                }}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder={t("builder.inputPreviews.optionPlaceholder")}
                disabled={settings.isOther}
                size="small"
                variant="standard"
                slotProps={{ input: { disableUnderline: true } }}
                sx={{ m: "10px" }}
              />
              <Box>
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
            </MenuItem>
          );
        })}
      </Menu>
      <AddOption
        disable={choices.some((choice) => {
          let [choiceId, label, settingsString] = choice;
          return label === "";
        })}
        choices={choices}
        callback={handleNewChoices}
        displayOther={false}
      />
    </Box>
  );
};
