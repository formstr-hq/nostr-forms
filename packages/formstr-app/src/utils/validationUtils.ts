import { NumberValidationRule } from "../nostr/types";

// Logic to evaluate rules against a numeric value.
export const validateNumberValidationRule = (
  numVal: number,
  rule: NumberValidationRule,
): boolean => {
  if (isNaN(numVal)) return false;

  switch (rule.type) {
    case "greaterThan":
      return rule.value1 !== undefined && numVal > rule.value1;
    case "greaterThanOrEqual":
      return rule.value1 !== undefined && numVal >= rule.value1;
    case "lessThan":
      return rule.value1 !== undefined && numVal < rule.value1;
    case "lessThanOrEqual":
      return rule.value1 !== undefined && numVal <= rule.value1;
    case "equalTo":
      return rule.value1 !== undefined && numVal === rule.value1;
    case "notEqualTo":
      return rule.value1 !== undefined && numVal !== rule.value1;
    case "between":
      return (
        rule.value1 !== undefined &&
        rule.value2 !== undefined &&
        numVal >= rule.value1 &&
        numVal <= rule.value2
      );
    case "notBetween":
      return (
        rule.value1 !== undefined &&
        rule.value2 !== undefined &&
        (numVal < rule.value1 || numVal > rule.value2)
      );
    case "wholeNumber":
      return Number.isInteger(numVal);
    case "isNumber":
      return true;
    default:
      return true;
  }
};

// Returns the default error message for a given rule.
export const getDefaultErrorMessage = (rule: NumberValidationRule): string => {
  switch (rule.type) {
    case "greaterThan":
      return `Must be greater than ${rule.value1}`;
    case "greaterThanOrEqual":
      return `Must be greater than or equal to ${rule.value1}`;
    case "lessThan":
      return `Must be less than ${rule.value1}`;
    case "lessThanOrEqual":
      return `Must be less than or equal to ${rule.value1}`;
    case "equalTo":
      return `Must be equal to ${rule.value1}`;
    case "notEqualTo":
      return `Must not be equal to ${rule.value1}`;
    case "between":
      return `Must be between ${rule.value1} and ${rule.value2}`;
    case "notBetween":
      return `Must not be between ${rule.value1} and ${rule.value2}`;
    case "wholeNumber":
      return "Must be a whole number";
    case "isNumber":
      return "Must be a valid number";
    default:
      return "Invalid value";
  }
};

