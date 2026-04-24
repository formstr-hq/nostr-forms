import { useMemo, useCallback } from "react";
import { Typography, Select } from "antd";
import { IProps } from "./validation.type";
import {
  ANSWER_TYPE_RULES_MENU,
  RULE_CONFIG,
  NUMBER_RULE_OPTIONS,
} from "../../configs/config";
import StyleWrapper from "./validation.style";
import {
  ValidationRuleTypes,
  AnswerTypes,
  NumberValidationRule,
  NumberValidationType,
} from "../../../../nostr/types";
import NumberRule from "./NumberRule";

const { Text } = Typography;

function Validation(props: IProps) {
  const { answerType, answerSettings, handleAnswerSettings } = props;
  const validationRules = answerSettings.validationRules ?? {};

  const selected = useMemo(
    () => Object.keys(validationRules) as ValidationRuleTypes[],
    [validationRules]
  );

  const onRuleSelect = useCallback(
    (val: ValidationRuleTypes) => {
      handleAnswerSettings({
        validationRules: {
          ...validationRules,
          [val]: {},
        },
      });
    },
    [validationRules, handleAnswerSettings]
  );

  const onSettingChange = useCallback(
    (ruleType: ValidationRuleTypes, val: unknown) => {
      handleAnswerSettings({
        validationRules: {
          ...validationRules,
          [ruleType]: val,
        },
      });
    },
    [validationRules, handleAnswerSettings]
  );

  const rules = useMemo(
    () =>
      (ANSWER_TYPE_RULES_MENU as any)[answerType]?.filter(
        (rule: any) => !selected.includes(rule.value)
      ) || [],
    [answerType, selected]
  );

  if (!selected.length && !ANSWER_TYPE_RULES_MENU[answerType]?.length)
    return null;

  if (answerType === AnswerTypes.number) {
    let currentRuleType = validationRules.numberRule?.type;
    let fallbackValues: NumberValidationRule | undefined;

    /**
     * Backward compatibility for legacy "range" rules.
     * If a form has an old 'range' rule but no new 'numberRule',
     * we map it to the "between" logic automatically.
     */
    if (!currentRuleType && validationRules.range) {
      currentRuleType = "between" as NumberValidationType;
      fallbackValues = {
        type: "between",
        value1: (validationRules.range as any).min,
        value2: (validationRules.range as any).max,
      } as NumberValidationRule;
    }

    const activeNumberRule = validationRules.numberRule || fallbackValues;
    const selectValue = currentRuleType ?? "none";

    const handleNumberRuleChange = (val: string) => {
      const { range, numberRule, ...rest } = validationRules;

      if (val === "none") {
        handleAnswerSettings({ validationRules: rest });
        return;
      }

      const typedVal = val as NumberValidationType;

      handleAnswerSettings({
        validationRules: {
          ...rest,
          numberRule: {
            ...activeNumberRule,
            type: typedVal,
            errorMessage: activeNumberRule?.errorMessage || "",
          },
        },
      });
    };

    return (
      <StyleWrapper className="input-property">
        <div className="header">
          <Text className="property-title">Validation</Text>

          <Select
            value={selectValue}
            options={NUMBER_RULE_OPTIONS}
            onChange={handleNumberRuleChange}
            style={{ width: "60%" }}
          />
        </div>

        {selectValue !== "none" && (
          <NumberRule
            rule={(activeNumberRule as NumberValidationRule) || undefined}
            onChange={(_: ValidationRuleTypes, ruleObj: NumberValidationRule) => {
              const { range, ...rest } = validationRules; // Safeguard: Strip old range rule on update

              handleAnswerSettings({
                validationRules: {
                  ...rest,
                  numberRule: ruleObj,
                },
              });
            }}
          />
        )}
      </StyleWrapper>
    );
  }

  return (
    <StyleWrapper className="input-property">
      <div className="header">
        <Text className="property-title">Validation</Text>

        {!!rules.length && (
          <Select placeholder="Select" options={rules} onChange={onRuleSelect} />
        )}
      </div>
      {!!selected.length &&
        selected.map((ruleType) => {
          const { key, component: Component } = (RULE_CONFIG as any)[ruleType];

          return (
            <Component
              key={key}
              rule={validationRules[ruleType]}
              onChange={onSettingChange}
            />
          );
        })}
    </StyleWrapper>
  );
}

export default Validation;
