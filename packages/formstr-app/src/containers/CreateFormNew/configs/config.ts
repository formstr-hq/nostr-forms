import { isGreaterThanOrEqual, isLessThanOrEqual, getNumValue } from "../utils";
import { validateNumberValidationRule } from "../../../utils/validationUtils";
import RangeComponent from "../components/Validation/Range";
import MaxComponent from "../components/Validation/Max";
import MinComponent from "../components/Validation/Min";
import RegexComponent from "../components/Validation/Regex";
import MatchComponent from "../components/Validation/Match";
import NumberRuleComponent from "../components/Validation/NumberRule";
import {
  AnswerTypes,
  MaxRule,
  MinRule,
  RangeRule,
  ValidationRuleTypes,
  NumberValidationRule,
} from "../../../nostr/types";

export const RULE_CONFIG = {
  [ValidationRuleTypes.range]: {
    key: ValidationRuleTypes.range,
    component: RangeComponent,
    validator: (val: number | string, rule: RangeRule) => {
      let newVal = getNumValue(val);
      return (
        isGreaterThanOrEqual(newVal, rule.min) &&
        isLessThanOrEqual(newVal, rule.max)
      );
    },
  },
  [ValidationRuleTypes.min]: {
    key: ValidationRuleTypes.min,
    component: MinComponent,
    validator: (val: number | string, rule: MinRule) => {
      return isGreaterThanOrEqual(getNumValue(val), rule.min);
    },
  },
  [ValidationRuleTypes.max]: {
    key: ValidationRuleTypes.max,
    component: MaxComponent,
    validator: (val: number | string, rule: MaxRule) => {
      return isGreaterThanOrEqual(getNumValue(val), rule.max);
    },
  },
  [ValidationRuleTypes.regex]: {
    key: ValidationRuleTypes.regex,
    component: RegexComponent,
    validator: (val: number | string, rule: MaxRule) => {
      return null;
    },
  },
  [ValidationRuleTypes.match]: {
    key: ValidationRuleTypes.match,
    component: MatchComponent,
    validator: (val: number | string, rule: MaxRule) => {
      return null;
    },
  },
  [ValidationRuleTypes.numberRule]: {
    key: ValidationRuleTypes.numberRule,
    component: NumberRuleComponent,
    validator: (val: any, rule: NumberValidationRule) => {
      const numVal = Number(val);
      return validateNumberValidationRule(numVal, rule);
    },
  },
};

const REGEX_RULE_ITEM = {
  key: ValidationRuleTypes.regex,
  value: ValidationRuleTypes.regex,
  label: "Pattern",
};

const RANGE_RULE_ITEM = {
  key: ValidationRuleTypes.range,
  value: ValidationRuleTypes.range,
  label: "Range",
};

export const NUMBER_RULE_OPTIONS = [
  { value: "none", label: "No Validation" },
  { value: "greaterThan", label: "Greater than" },
  { value: "greaterThanOrEqual", label: "Greater than or equal to" },
  { value: "lessThan", label: "Less than" },
  { value: "lessThanOrEqual", label: "Less than or equal to" },
  { value: "equalTo", label: "Equal to" },
  { value: "notEqualTo", label: "Not equal to" },
  { value: "between", label: "Between" },
  { value: "notBetween", label: "Not between" },
  { value: "isNumber", label: "Is number" },
  { value: "wholeNumber", label: "Whole number" },
];

const NUMBER_RULE_ITEM = {
  key: ValidationRuleTypes.numberRule,
  value: ValidationRuleTypes.numberRule,
  label: "Number Validation",
};

const MIN_RULE_ITEM = {
  key: ValidationRuleTypes.min,
  value: ValidationRuleTypes.min,
  label: "Min",
};

const MAX_RULE_ITEM = {
  key: ValidationRuleTypes.max,
  value: ValidationRuleTypes.max,
  label: "Max",
};

type ANSWER_TYPE_RULES_MENU_TYPE = { [key in AnswerTypes]: any[] };

export const ANSWER_TYPE_RULES_MENU: ANSWER_TYPE_RULES_MENU_TYPE = {
  [AnswerTypes.number]: [NUMBER_RULE_ITEM],
  [AnswerTypes.paragraph]: [MIN_RULE_ITEM, MAX_RULE_ITEM, REGEX_RULE_ITEM],
  [AnswerTypes.shortText]: [MIN_RULE_ITEM, MAX_RULE_ITEM, REGEX_RULE_ITEM],
  [AnswerTypes.checkboxes]: [],
  [AnswerTypes.radioButton]: [],
  [AnswerTypes.dropdown]: [],
  [AnswerTypes.label]: [],
  [AnswerTypes.date]: [],
  [AnswerTypes.time]: [],
  [AnswerTypes.signature]: [],
  [AnswerTypes.datetime]: [],
  [AnswerTypes.multipleChoiceGrid]: [],
  [AnswerTypes.checkboxGrid]: [],
  [AnswerTypes.fileUpload]: [],
};
