import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from "@mui/material";
import ChoiceFillerStyle from "./choiceFiller.style";
import { ChangeEvent, useEffect, useState } from "react";
import SafeMarkdown from "../../../../components/SafeMarkdown";
import { AnswerTypes, Option } from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

interface ChoiceFillerProps {
  answerType: AnswerTypes.checkboxes | AnswerTypes.radioButton;
  options: Option[];
  onChange: (value: string, message: string) => void;
  defaultValue?: string;
  defaultMessage?: string;
  disabled?: boolean;
  testId?: string;
}

export const ChoiceFiller: React.FC<ChoiceFillerProps> = ({
  answerType,
  options,
  onChange,
  defaultValue,
  defaultMessage,
  disabled = false,
  testId = "choice-filler",
}) => {
  const { t } = useTranslation();
  const [otherMessage, setOtherMessage] = useState(defaultMessage || "");

  useEffect(() => {
    setOtherMessage(defaultMessage || "");
  }, [defaultMessage]);

  const isCheckbox = answerType === AnswerTypes.checkboxes;
  const selectedValues = isCheckbox
    ? (defaultValue || "").split(";").filter(Boolean)
    : [];

  function handleRadioChange(e: ChangeEvent<HTMLInputElement>): void {
    onChange(e.target.value, otherMessage);
  }

  function handleCheckboxToggle(choiceId: string, checked: boolean): void {
    const next = checked
      ? [...selectedValues, choiceId]
      : selectedValues.filter((id) => id !== choiceId);
    onChange(next.sort().join(";"), otherMessage);
  }

  function handleMessage(e: ChangeEvent<HTMLInputElement>) {
    const msg = e.target.value;
    setOtherMessage(msg);
    if (defaultValue) {
      onChange(defaultValue, msg);
    }
  }

  function isOtherSelected(choiceId: string) {
    if (!defaultValue) return false;
    if (isCheckbox) {
      return defaultValue.split(";").includes(choiceId);
    }
    return defaultValue === choiceId;
  }

  function handleClear() {
    setOtherMessage("");
    onChange("", "");
  }

  return (
    <ChoiceFillerStyle>
      {isCheckbox ? (
        <FormGroup data-testid={`${testId}:group`}>
          <Stack spacing={1}>
            {options.map((choice) => {
              let [choiceId, label, configString] = choice;
              let config = JSON.parse(configString || "{}");
              return (
                <Box key={choiceId}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedValues.includes(choiceId)}
                        onChange={(e) =>
                          handleCheckboxToggle(choiceId, e.target.checked)
                        }
                        disabled={disabled}
                        data-testid={`${testId}:option-${choiceId}`}
                      />
                    }
                    label={<SafeMarkdown>{label}</SafeMarkdown>}
                  />
                  {config.isOther && (
                    <TextField
                      size="small"
                      placeholder={t("filler.inputs.optionalMessage")}
                      value={otherMessage}
                      onChange={handleMessage}
                      disabled={disabled || !isOtherSelected(choiceId)}
                      data-testid={`${testId}-other-input-${choiceId}`}
                      sx={{ ml: 4 }}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>
        </FormGroup>
      ) : (
        <RadioGroup
          value={defaultValue ?? ""}
          onChange={handleRadioChange}
          data-testid={`${testId}:group`}
        >
          <Stack spacing={1}>
            {options.map((choice) => {
              let [choiceId, label, configString] = choice;
              let config = JSON.parse(configString || "{}");
              return (
                <Box key={choiceId}>
                  <FormControlLabel
                    value={choiceId}
                    control={
                      <Radio
                        disabled={disabled}
                        data-testid={`${testId}:option-${choiceId}`}
                      />
                    }
                    disabled={disabled}
                    label={<SafeMarkdown>{label}</SafeMarkdown>}
                  />
                  {config.isOther && (
                    <TextField
                      size="small"
                      placeholder={t("filler.inputs.optionalMessage")}
                      value={otherMessage}
                      onChange={handleMessage}
                      disabled={disabled || !isOtherSelected(choiceId)}
                      data-testid={`${testId}-other-input-${choiceId}`}
                      sx={{ ml: 4 }}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>
        </RadioGroup>
      )}
      {defaultValue && !disabled && (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="text"
            size="small"
            onClick={handleClear}
            sx={{ px: 0, py: 0.5, fontSize: "12px" }}
          >
            {t("filler.inputs.clearSelection")}
          </Button>
        </Box>
      )}
    </ChoiceFillerStyle>
  );
};
