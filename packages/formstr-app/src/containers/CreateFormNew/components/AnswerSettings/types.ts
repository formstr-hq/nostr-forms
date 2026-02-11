import {
  MatchRule,
  MaxRule,
  MinRule,
  NumberConstraint,
  RangeRule,
  RegexRule,
  ValidationRuleTypes,
} from "../../../../nostr/types";

export interface IAnswerSettings {
  numberConstraints?: NumberConstraint;
  required?: boolean;
  signature?: {
    kind?: number;
    editableContent?: boolean;
    prefilledContent?: string;
    editableCreatedAt?: boolean;
  };
  blossomServer?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  validationRules?: {
    [ValidationRuleTypes.range]?: RangeRule;
    [ValidationRuleTypes.max]?: MaxRule;
    [ValidationRuleTypes.min]?: MinRule;
    [ValidationRuleTypes.regex]?: RegexRule;
    [ValidationRuleTypes.match]?: MatchRule;
  };
  [key: string]: unknown;
}
