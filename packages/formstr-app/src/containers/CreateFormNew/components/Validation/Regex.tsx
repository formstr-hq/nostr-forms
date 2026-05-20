import { Tooltip, Typography } from "antd";
import { InputStyle } from "./validation.style";
import { ChangeEvent, useState } from "react";
import { isMobile } from "../../../../utils/utility";
import { RegexRule, ValidationRuleTypes } from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

function isValidRegex(input: string): boolean {
  try {
    new RegExp(input);
    return true;
  } catch (error) {
    return false;
  }
}

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
      <Tooltip
        title={t("builder.validation.patternTooltip")}
        trigger={isMobile() ? "click" : "hover"}
      >
        <InputStyle>
          <Text className="property-name">{t("builder.validation.patternLabel")}</Text>
          <input
            className="number-input"
            value={tempPattern}
            onChange={handlePatternChange}
          />
        </InputStyle>
      </Tooltip>
      {patternError && <Text type="danger">{patternError}</Text>}
      <InputStyle>
        <Text className="property-name">{t("builder.validation.errorMessage")}</Text>
        <input
          className="number-input"
          type="text"
          value={rule?.errorMessage}
          onChange={handleErrorMessageChange}
        />
      </InputStyle>
    </>
  );
}

export default Regex;
