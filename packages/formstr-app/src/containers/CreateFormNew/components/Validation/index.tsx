import { useEffect, useState } from "react";
import { Box, FormControl, MenuItem, Select, Typography } from "@mui/material";
import { IProps } from "./validation.type";
import { ANSWER_TYPE_RULES_MENU, RULE_CONFIG } from "../../configs/config";
import { ValidationRuleTypes } from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

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
    <Box sx={{ m: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography sx={{ display: "block", my: 1.5 }}>
            {t("builder.validation.title")}
          </Typography>
        </Box>
        {!!rules.length && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value=""
              displayEmpty
              renderValue={() => t("builder.validation.selectPlaceholder")}
              onChange={(e) =>
                onRuleSelect(e.target.value as ValidationRuleTypes)
              }
            >
              {translatedRules.map((rule) => (
                <MenuItem key={rule.value} value={rule.value}>
                  {rule.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
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
    </Box>
  );
}

export default Validation;
