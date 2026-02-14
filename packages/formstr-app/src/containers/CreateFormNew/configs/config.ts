import { isGreaterThanOrEqual, isLessThanOrEqual, getNumValue } from "../utils";
import RangeComponent from "../components/Validation/Range";
import MaxComponent from "../components/Validation/Max";
import MinComponent from "../components/Validation/Min";
import RegexComponent from "../components/Validation/Regex";
import MatchComponent from "../components/Validation/Match";
import {
  AnswerTypes,
  MaxRule,
  MinRule,
  RangeRule,
  ValidationRuleTypes,
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
  [AnswerTypes.number]: [RANGE_RULE_ITEM],
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
