import { Box, TextField, Tooltip, Typography } from "@mui/material";
import { ChangeEvent, useState } from "react";
import { RegexRule, ValidationRuleTypes } from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

function isValidRegex(input: string): boolean {
  try {
    new RegExp(input);
    return true;
  } catch (error) {
    return false;
  }
}

const rowSx = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  mb: 1,
};

function Regex({ rule, onChange }: { rule?: RegexRule; onChange: Function }) {
  const { t } = useTranslation();
  const [patternError, setPatternError] = useState<string | null>(null);
  const [tempPattern, setTempPattern] = useState<string>(rule?.pattern || "");

  function handlePatternChange(e: ChangeEvent<HTMLInputElement>) {
    setTempPattern(e.target.value);
    if (!isValidRegex(e.target.value)) {
      setPatternError(t("builder.validation.invalidPattern"));
      return;
    }
    setPatternError(null);
    onChange(ValidationRuleTypes.regex, {
      pattern: e.target.value,
      errorMessage: rule?.errorMessage,
    });
  }

  function handleErrorMessageChange(e: ChangeEvent<HTMLInputElement>) {
    if (!rule?.pattern) {
      setPatternError(t("builder.validation.patternRequired"));
      return;
    }
    onChange(ValidationRuleTypes.regex, {
      pattern: rule?.pattern,
      errorMessage: e.target.value,
    });
  }

  return (
    <>
      <Tooltip title={t("builder.validation.patternTooltip")}>
        <Box sx={rowSx}>
          <Typography variant="body2" color="text.secondary">
            {t("builder.validation.patternLabel")}
          </Typography>
          <TextField
            size="small"
            value={tempPattern}
            onChange={handlePatternChange}
            sx={{ width: "50%" }}
          />
        </Box>
      </Tooltip>
      {patternError && (
        <Typography variant="body2" color="error">
          {patternError}
        </Typography>
      )}
      <Box sx={rowSx}>
        <Typography variant="body2" color="text.secondary">
          {t("builder.validation.errorMessage")}
        </Typography>
        <TextField
          size="small"
          value={rule?.errorMessage ?? ""}
          onChange={handleErrorMessageChange}
          sx={{ width: "50%" }}
        />
      </Box>
    </>
  );
}

export default Regex;
