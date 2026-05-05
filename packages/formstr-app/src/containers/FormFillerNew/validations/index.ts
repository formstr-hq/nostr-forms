import { Rule } from "antd/es/form";
import { 
  validateNumberValidationRule,
  getDefaultErrorMessage
} from "../../../utils/validationUtils";
import {
  AnswerSettings,
  AnswerTypes,
  GridOptions,
  GridResponse,
  MatchRule,
  MaxRule,
  MinRule,
  RangeRule,
  RegexRule,
  ValidationRuleTypes,
  NumberValidationRule,
} from "../../../nostr/types";

//TODO: Find a method better than "any" with overloads for dynamic types
function NumRange(rule: any): Rule;
function NumRange(rule: RangeRule): Rule {
  return {
    validator: (_: any, value: any) => {
      if (!value) return Promise.resolve();
      if (!rule.min && !rule.max) return Promise.resolve();
      if (rule.min && value[0] < rule.min) {
        return Promise.reject(`Please enter number more than ${rule.min}`);
      }
      if (rule.max && value[0] > rule.max) {
        return Promise.reject(`Please enter number less than ${rule.max}`);
      }
      return Promise.resolve();
    },
  };
}

function MinLength(rule: any): Rule;
function MinLength(rule: MinRule): Rule {
  return {
    validator: (_: any, value: any) => {
      if (!value) return Promise.resolve();
      if (!rule.min) return Promise.resolve();
      if (value[0].length < rule.min) {
        return Promise.reject(`Please enter more than ${rule.min} chars`);
      }
      return Promise.resolve();
    },
  };
}

function MaxLength(rule: any): Rule;
function MaxLength(rule: MaxRule): Rule {
  return {
    validator: (_: any, value: any) => {
      if (!value) return Promise.resolve();
      if (!rule.max) return Promise.resolve();
      if (value[0].length > rule.max) {
        return Promise.reject(`Please enter less than ${rule.max} chars`);
      }
      return Promise.resolve();
    },
  };
}

function Regex(rule: any): Rule;
function Regex(rule: RegexRule): Rule {
  return {
    validator: (_: any, value: any) => {
      if (!value) return Promise.resolve();
      if (!rule.pattern) return Promise.resolve();
      if (!new RegExp(rule.pattern).test(value[0])) {
        return Promise.reject(
          rule.errorMessage || `Did not match the pattern: ${rule.pattern}`,
        );
      }
      return Promise.resolve();
    },
  };
}

function Match(rule: any, answerType?: AnswerTypes): Rule;
function Match(rule: MatchRule, answerType?: AnswerTypes): Rule {
  return {
    validator: (_: any, value: any) => {
      if (!value) return Promise.resolve();
      if (!rule.answer) return Promise.resolve();

      const userValue = value[0];

      // Handle grid questions - compare GridResponse objects
      if (
        answerType === AnswerTypes.multipleChoiceGrid ||
        answerType === AnswerTypes.checkboxGrid
      ) {
        try {
          const userResponse: GridResponse = JSON.parse(userValue);
          const correctResponse: GridResponse = JSON.parse(
            rule.answer as string,
          );

          // Check if all rows match
          for (const [rowId, correctColumnIds] of Object.entries(
            correctResponse,
          )) {
            const userColumnIds = userResponse[rowId];

            if (!userColumnIds) {
              return Promise.reject(
                `This is not the correct answer for this question`,
              );
            }

            // For checkbox grids, compare sorted arrays
            const userIds = userColumnIds.split(";").filter(Boolean).sort();
            const correctIds = correctColumnIds
              .split(";")
              .filter(Boolean)
              .sort();

            if (
              userIds.length !== correctIds.length ||
              !userIds.every((id, idx) => id === correctIds[idx])
            ) {
              return Promise.reject(
                `This is not the correct answer for this question`,
              );
            }
          }

          return Promise.resolve();
        } catch (e) {
          return Promise.reject(`Invalid grid response format`);
        }
      }

      // Simple comparison for non-grid questions
      if (userValue === rule.answer) {
        return Promise.resolve();
      }

      return Promise.reject(`This is not the correct answer for this question`);
    },
  };
}

function NumberRuleValidator(rule: any): Rule;
function NumberRuleValidator(rule: NumberValidationRule): Rule {
  return {
    validator: (_: any, value: any) => {
      if (!value || value.length === 0 || value[0] === "" || value[0] === null) return Promise.resolve();
      
      let numVal = Number(value[0]);
      if (isNaN(numVal)) {
          return Promise.reject(rule.errorMessage || "Please enter a valid number");
      }

      if (!validateNumberValidationRule(numVal, rule)) {
        return Promise.reject(rule.errorMessage || getDefaultErrorMessage(rule));
      }
      
      return Promise.resolve();
    }
  }
}

const RuleValidatorMap = {
  [ValidationRuleTypes.range]: NumRange,
  [ValidationRuleTypes.max]: MaxLength,
  [ValidationRuleTypes.min]: MinLength,
  [ValidationRuleTypes.regex]: Regex,
  [ValidationRuleTypes.match]: Match,
  [ValidationRuleTypes.numberRule]: NumberRuleValidator,
};

function createRule(
  ruleType: ValidationRuleTypes,
  validationRules: AnswerSettings["validationRules"],
): Rule {
  if (!validationRules) return {};
  const ruleCreator = RuleValidatorMap[ruleType];
  const rule = validationRules[ruleType];
  if (!rule) return {};
  return ruleCreator(rule);
}

function GridValidator(gridOptions: GridOptions): Rule {
  return {
    validator: (_: any, value: any) => {
      if (!value || !value[0]) return Promise.resolve();

      try {
        const responses: GridResponse = JSON.parse(value[0]);

        // Check if all rows are answered
        for (const [rowId, rowLabel] of gridOptions.rows) {
          if (!responses[rowId] || responses[rowId] === "") {
            return Promise.reject(
              `Please answer all rows: "${rowLabel}" is missing`,
            );
          }
        }

        return Promise.resolve();
      } catch (e) {
        return Promise.reject("Invalid grid response format");
      }
    },
  };
}

export const getValidationRules = (
  answerType: AnswerTypes,
  answerSettings: AnswerSettings,
  gridOptions?: GridOptions,
) => {
  let rules: Rule[] = [];

  // Special handling for grid questions
  if (
    (answerType === AnswerTypes.multipleChoiceGrid ||
      answerType === AnswerTypes.checkboxGrid) &&
    gridOptions
  ) {
    rules.push(GridValidator(gridOptions));
    return rules;
  }

  let validationRules = answerSettings.validationRules;
  if (!validationRules) return rules;
  let ruleTypes = Object.keys(validationRules) as ValidationRuleTypes[];
  ruleTypes.forEach((ruleType) => {
    if (validationRules && validationRules[ruleType]) {
      rules.push(createRule(ruleType, validationRules));
    }
  });
  return rules;
};
