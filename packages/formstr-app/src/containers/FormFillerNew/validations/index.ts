import {
  AnswerSettings,
  AnswerTypes,
  Field,
  GridOptions,
  GridResponse,
  MatchRule,
  MaxRule,
  MinRule,
  RangeRule,
  RegexRule,
  ValidationRuleTypes,
} from "../../../nostr/types";

/**
 * A field's stored value in the filler: a [answer, message] tuple, or null
 * when the answer was cleared. This mirrors what the antd Form instance used
 * to hold per field.
 */
export type FormFieldValue = [string, string | undefined] | null;
export type FormValues = Record<string, FormFieldValue>;
export type FieldErrors = Record<string, string>;

/**
 * A validator returns an error message when the value fails, or null when it
 * passes. (Replacement for antd's Rule/validator promises now that the filler
 * no longer uses antd Form.)
 */
export type FieldValidator = (value: FormFieldValue) => string | null;

/** Message shown when a required question has no answer. */
export const REQUIRED_MESSAGE = "This is a required question";

/** Empty means: never touched, explicitly cleared, or an empty-string answer. */
export const isValueEmpty = (
  value: FormFieldValue | undefined,
): boolean => {
  if (!value) return true;
  const answer = value[0];
  return answer === null || answer === undefined || answer === "";
};

//TODO: Find a method better than "any" with overloads for dynamic types
function NumRange(rule: any): FieldValidator;
function NumRange(rule: RangeRule): FieldValidator {
  return (value) => {
    if (!value) return null;
    if (!rule.min && !rule.max) return null;
    // Stored answers are strings now (antd held numbers); JS used to coerce
    // them in these comparisons, so coerce explicitly to keep behavior.
    const num = Number(value[0]);
    if (rule.min && num < rule.min) {
      return `Please enter number more than ${rule.min}`;
    }
    if (rule.max && num > rule.max) {
      return `Please enter number less than ${rule.max}`;
    }
    return null;
  };
}

function MinLength(rule: any): FieldValidator;
function MinLength(rule: MinRule): FieldValidator {
  return (value) => {
    if (!value) return null;
    if (!rule.min) return null;
    if (value[0].length < rule.min) {
      return `Please enter more than ${rule.min} chars`;
    }
    return null;
  };
}

function MaxLength(rule: any): FieldValidator;
function MaxLength(rule: MaxRule): FieldValidator {
  return (value) => {
    if (!value) return null;
    if (!rule.max) return null;
    if (value[0].length > rule.max) {
      return `Please enter less than ${rule.max} chars`;
    }
    return null;
  };
}

function Regex(rule: any): FieldValidator;
function Regex(rule: RegexRule): FieldValidator {
  return (value) => {
    if (!value) return null;
    if (!rule.pattern) return null;
    if (!new RegExp(rule.pattern).test(value[0])) {
      return rule.errorMessage || `Did not match the pattern: ${rule.pattern}`;
    }
    return null;
  };
}

function Match(rule: any, answerType?: AnswerTypes): FieldValidator;
function Match(rule: MatchRule, answerType?: AnswerTypes): FieldValidator {
  return (value) => {
    if (!value) return null;
    if (!rule.answer) return null;

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

        // No actual cell selected in the "right answer" (e.g. the author
        // selected then unselected one in the builder, leaving "{}" or a row
        // with an empty selection). That's not a real correct-answer
        // constraint — don't fail every submission against it.
        const hasCorrectSelection = Object.values(correctResponse).some(
          (cols) => (cols ?? "").split(";").filter(Boolean).length > 0,
        );
        if (!hasCorrectSelection) return null;

        // Check if all rows match
        for (const [rowId, correctColumnIds] of Object.entries(
          correctResponse,
        )) {
          const userColumnIds = userResponse[rowId];

          if (!userColumnIds) {
            return `This is not the correct answer for this question`;
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
            return `This is not the correct answer for this question`;
          }
        }

        return null;
      } catch (e) {
        return `Invalid grid response format`;
      }
    }

    // Simple comparison for non-grid questions
    if (userValue === rule.answer) {
      return null;
    }

    return `This is not the correct answer for this question`;
  };
}

const RuleValidatorMap = {
  [ValidationRuleTypes.range]: NumRange,
  [ValidationRuleTypes.max]: MaxLength,
  [ValidationRuleTypes.min]: MinLength,
  [ValidationRuleTypes.regex]: Regex,
  [ValidationRuleTypes.match]: Match,
};

function createRule(
  ruleType: ValidationRuleTypes,
  validationRules: AnswerSettings["validationRules"],
  answerType?: string,
): FieldValidator {
  if (!validationRules) return () => null;
  const rule = validationRules[ruleType];
  if (!rule) return () => null;
  // Match needs the answer type so grid right-answers are compared cell-by-cell
  // rather than by fragile whole-string equality of the serialized response.
  if (ruleType === ValidationRuleTypes.match) {
    return Match(rule as MatchRule, answerType as AnswerTypes | undefined);
  }
  const ruleCreator = RuleValidatorMap[ruleType];
  return ruleCreator(rule);
}

function GridValidator(gridOptions: GridOptions): FieldValidator {
  return (value) => {
    if (!value || !value[0]) return null;

    try {
      const responses: GridResponse = JSON.parse(value[0]);

      // Check if all rows are answered
      for (const [rowId, rowLabel] of gridOptions.rows) {
        if (!responses[rowId] || responses[rowId] === "") {
          return `Please answer all rows: "${rowLabel}" is missing`;
        }
      }

      return null;
    } catch (e) {
      return "Invalid grid response format";
    }
  };
}

export const getValidationRules = (
  answerType: string | undefined,
  answerSettings: AnswerSettings,
  gridOptions?: GridOptions,
): FieldValidator[] => {
  let rules: FieldValidator[] = [];

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
      rules.push(createRule(ruleType, validationRules, answerType));
    }
  });
  return rules;
};

/**
 * Validate a single field's value: required check first, then the field's
 * configured validation rules (in declared order). Returns the first error
 * message, or null when the value is valid. Non-required empty values always
 * pass (every rule validator passes on empty, like antd's rules did).
 */
export const validateFieldValue = (
  field: Field,
  value: FormFieldValue | undefined,
): string | null => {
  const configString = field[5];
  let fieldConfig: AnswerSettings;
  try {
    fieldConfig = JSON.parse(configString || "{}");
  } catch {
    fieldConfig = {} as AnswerSettings;
  }

  if (isValueEmpty(value)) {
    return fieldConfig.required ? REQUIRED_MESSAGE : null;
  }

  const validators = getValidationRules(
    fieldConfig.renderElement,
    fieldConfig,
  );
  for (const validate of validators) {
    const error = validate(value ?? null);
    if (error) return error;
  }
  return null;
};

/**
 * Validate a set of fields against current values. Returns a map of
 * fieldId -> error message containing only the fields that failed.
 */
export const validateFields = (
  fields: Field[],
  values: FormValues,
): FieldErrors => {
  const errors: FieldErrors = {};
  fields.forEach((field) => {
    const error = validateFieldValue(field, values[field[1]]);
    if (error) {
      errors[field[1]] = error;
    }
  });
  return errors;
};
