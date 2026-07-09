import { Rule } from "antd/es/form";
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
} from "../../../nostr/types";

// The value from antd form for these inputs seems to be an array of values
type FormValue = string[] | number[] | undefined | null;

function NumRange(rule: RangeRule): Rule {
  return {
    validator: (_: unknown, value: FormValue) => {
      if (!value || value.length === 0) return Promise.resolve();
      if (!rule.min && !rule.max) return Promise.resolve();

      const val = (value as number[])[0];
      if (typeof val !== 'number') return Promise.resolve();

      if (rule.min && val < rule.min) {
        return Promise.reject(`Please enter number more than ${rule.min}`);
      }
      if (rule.max && val > rule.max) {
        return Promise.reject(`Please enter number less than ${rule.max}`);
      }
      return Promise.resolve();
    },
  };
}

function MinLength(rule: MinRule): Rule {
  return {
    validator: (_: unknown, value: FormValue) => {
      if (!value || value.length === 0) return Promise.resolve();
      if (!rule.min) return Promise.resolve();

      const val = (value as string[])[0];
      if (typeof val !== 'string') return Promise.resolve();

      if (val.length < rule.min) {
        return Promise.reject(`Please enter more than ${rule.min} chars`);
      }
      return Promise.resolve();
    },
  };
}

function MaxLength(rule: MaxRule): Rule {
  return {
    validator: (_: unknown, value: FormValue) => {
      if (!value || value.length === 0) return Promise.resolve();
      if (!rule.max) return Promise.resolve();

      const val = (value as string[])[0];
      if (typeof val !== 'string') return Promise.resolve();

      if (val.length > rule.max) {
        return Promise.reject(`Please enter less than ${rule.max} chars`);
      }
      return Promise.resolve();
    },
  };
}

function Regex(rule: RegexRule): Rule {
  return {
    validator: (_: unknown, value: FormValue) => {
      if (!value || value.length === 0) return Promise.resolve();
      if (!rule.pattern) return Promise.resolve();

      const val = (value as string[])[0];
      if (typeof val !== 'string') return Promise.resolve();

      if (!new RegExp(rule.pattern).test(val)) {
        return Promise.reject(
          rule.errorMessage || `Did not match the pattern: ${rule.pattern}`,
        );
      }
      return Promise.resolve();
    },
  };
}

function Match(rule: MatchRule, answerType?: AnswerTypes): Rule {
  return {
    validator: (_: unknown, value: FormValue) => {
      if (!value || value.length === 0) return Promise.resolve();
      if (!rule.answer) return Promise.resolve();

      const userValue = (value as string[])[0];

      // Handle grid questions - compare GridResponse objects
      if (
        answerType === AnswerTypes.multipleChoiceGrid ||
        answerType === AnswerTypes.checkboxGrid
      ) {
        if (typeof userValue !== 'string') return Promise.resolve();

        try {
          const userResponse = JSON.parse(userValue) as GridResponse;
          const correctResponse = JSON.parse(
            rule.answer as string,
          ) as GridResponse;

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
      // rule.answer can be number/string/boolean. userValue is string/number from array.
      if (userValue === rule.answer) {
        return Promise.resolve();
      }

      // Attempt loose comparison if strict failed (e.g. "5" == 5)
      // eslint-disable-next-line eqeqeq
      if (userValue == rule.answer) {
        return Promise.resolve();
      }

      return Promise.reject(`This is not the correct answer for this question`);
    },
  };
}

function createRule(
  ruleType: ValidationRuleTypes,
  validationRules: AnswerSettings["validationRules"],
): Rule {
  if (!validationRules) return {};

  switch (ruleType) {
    case ValidationRuleTypes.range:
      return validationRules.range ? NumRange(validationRules.range) : {};
    case ValidationRuleTypes.max:
      return validationRules.max ? MaxLength(validationRules.max) : {};
    case ValidationRuleTypes.min:
      return validationRules.min ? MinLength(validationRules.min) : {};
    case ValidationRuleTypes.regex:
      return validationRules.regex ? Regex(validationRules.regex) : {};
    case ValidationRuleTypes.match:
      return validationRules.match ? Match(validationRules.match) : {};
    default:
      return {};
  }
}

function GridValidator(gridOptions: GridOptions): Rule {
  return {
    validator: (_: unknown, value: FormValue) => {
      if (!value || value.length === 0) return Promise.resolve();

      const val = (value as string[])[0];
      if (typeof val !== 'string') return Promise.resolve();

      try {
        const responses = JSON.parse(val) as GridResponse;

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
  const rules: Rule[] = [];

  // Special handling for grid questions
  if (
    (answerType === AnswerTypes.multipleChoiceGrid ||
      answerType === AnswerTypes.checkboxGrid) &&
    gridOptions
  ) {
    rules.push(GridValidator(gridOptions));
    return rules;
  }

  const validationRules = answerSettings.validationRules;
  if (!validationRules) return rules;
  const ruleTypes = Object.keys(validationRules) as ValidationRuleTypes[];
  ruleTypes.forEach((ruleType) => {
    if (validationRules && validationRules[ruleType]) {
      rules.push(createRule(ruleType, validationRules));
    }
  });
  return rules;
};
