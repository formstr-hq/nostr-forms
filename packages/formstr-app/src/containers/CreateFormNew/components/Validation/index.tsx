import { useEffect, useState } from "react";
import { Typography, Select } from "antd";
import { IProps } from "./validation.type";
import { ANSWER_TYPE_RULES_MENU, RULE_CONFIG } from "../../configs/config";
import StyleWrapper from "./validation.style";
import { ValidationRuleTypes } from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

function Validation(props: IProps) {
  const { t } = useTranslation();
  const { answerType, answerSettings, handleAnswerSettings } = props;
  const validationRules = answerSettings.validationRules ?? {};
  const defaultSelected = Object.keys(validationRules) as ValidationRuleTypes[];

  const [selected, setSelected] =
    useState<ValidationRuleTypes[]>(defaultSelected);

  useEffect(() => {
    setSelected(defaultSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerType]);

  if (!selected.length && !ANSWER_TYPE_RULES_MENU[answerType].length)
    return null;

  const onRuleSelect = (val: any) => {
    const newSelected = [...selected, val];
    setSelected(newSelected);
  };

  const onSettingChange = (ruleType: ValidationRuleTypes, val: any) => {
    handleAnswerSettings({
      validationRules: { ...validationRules, [ruleType]: val },
    });
  };

  let rules = ANSWER_TYPE_RULES_MENU[answerType].filter(
    (rule) => !selected.includes(rule.value),
  );
  const translatedRules = rules.map((rule) => ({
    ...rule,
    label: t(rule.labelKey),
  }));

  return (
    <StyleWrapper className="input-property">
      <div className="header">
        <div>
          <Text className="property-title">{t("builder.validation.title")}</Text>
        </div>
        {!!rules.length && (
          <Select
            value={t("builder.validation.selectPlaceholder")}
            options={translatedRules}
            onChange={onRuleSelect}
          />
        )}
      </div>
      {!!selected.length &&
        selected.map((ruleType) => {
          let { key, component: Component } = RULE_CONFIG[ruleType];
          return (
            <Component
              key={key}
              //@ts-ignore
              rule={validationRules[ruleType]}
              onChange={onSettingChange}
            />
          );
        })}
    </StyleWrapper>
  );
}

export default Validation;
