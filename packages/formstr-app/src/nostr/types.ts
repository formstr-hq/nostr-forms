import { Event } from "nostr-tools";

export type Field = [
  placeholder: string,
  fieldId: string,
  dataType: string,
  label: string,
  options: string,
  config: string,
];

export type Tag = string[];

export type Option = [
  optionId: string,
  optionLabeL: string,
  optionConfig?: string,
];

export type Response = [
  placeholder: string,
  fieldId: string,
  response: string,
  metadata: string,
];

export type AccesType = "vote" | "view" | "edit";

export interface AccessRequest {
  pubkey: string;
  accessType: AccesType;
}

export interface IWrap {
  receiverWrapEvent: Event;
  senderWrapEvent?: Event;
  receiverPubkey: string;
  issuerPubkey: string;
}

export const KINDS = {
  myFormsList: 14083,
  formTemplate: 30168,
};

export enum AnswerTypes {
  shortText = "shortText",
  paragraph = "paragraph",
  radioButton = "radioButton",
  checkboxes = "checkboxes",
  dropdown = "dropdown",
  number = "number",
  date = "date",
  label = "label",
  time = "time",
  signature = "signature",
  datetime = "datetime",
  multipleChoiceGrid = "multipleChoiceGrid",
  checkboxGrid = "checkboxGrid",
  fileUpload = "fileUpload",
}

export interface FormSpec {
  schemaVersion: string;
  schemaLink?: string;
  name: string;
  fields?: Array<Field>;
  description?: string;
  settings?: IFormSettings;
  metadata?: unknown;
}
export interface V1FormSpec {
  schemaVersion: string;
  schemaLink?: string;
  name: string;
  fields?: Array<V1Field>;
  settings?: IFormSettings;
  metadata?: unknown;
}

export interface Choice {
  choiceId: string;
  label: string;
  isOther?: boolean;
  configString?: string;
}
export interface V1Choice {
  choiceId: string;
  label: string;
  isOther?: boolean;
}
export interface NumberConstraint {
  min: number;
  max: number;
}
export enum ValidationRuleTypes {
  range = "range",
  max = "max",
  min = "min",
  regex = "regex",
  match = "match",
}
export interface RangeRule {
  min: number;
  max: number;
}
export interface RegexRule {
  pattern: string;
  errorMessage: string;
}
export interface MatchRule {
  answer: string | number | boolean;
}
export interface MaxRule {
  max: number;
}
export interface MinRule {
  min: number;
}
export interface GridOptions {
  columns: Array<
    [columnId: string, columnLabel: string, columnConfig?: string]
  >;
  rows: Array<[rowId: string, rowLabel: string, rowConfig?: string]>;
}

export type GridResponse = Record<string, string>; // rowId -> columnId(s)

export interface GridFieldSettings extends AnswerSettings {
  renderElement: "multipleChoiceGrid" | "checkboxGrid";
  allowMultiplePerRow: boolean;
  required?: boolean;
  requiredRows?: string[]; // Specific rows that must be answered
}

export interface FileUploadSettings extends AnswerSettings {
  renderElement: "fileUpload";
  blossomServer: string;
  maxFileSize?: number; // in MB
  allowedTypes?: string[]; // MIME types
}

export interface FileUploadMetadata {
  sha256: string;
  filename: string;
  size: number;
  mimeType: string;
  server: string;
  uploadedAt: number;
}

export interface AnswerSettings {
  renderElement?: string;
  choices?: Array<Choice>;
  numberConstraints?: NumberConstraint;
  required?: boolean;
  validationRules?: {
    [ValidationRuleTypes.range]?: RangeRule;
    [ValidationRuleTypes.max]?: MaxRule;
    [ValidationRuleTypes.min]?: MinRule;
    [ValidationRuleTypes.regex]?: RegexRule;
    [ValidationRuleTypes.match]?: MatchRule;
  };
  [key: string]: unknown;
}
export interface V1AnswerSettings {
  choices?: Array<V1Choice>;
  numberConstraints?: NumberConstraint;
  required?: boolean;
  [key: string]: unknown;
}

export interface V1Field {
  question: string;
  questionId: string;
  answerType: AnswerTypes;
  answerSettings: V1AnswerSettings;
}
export interface V1Response {
  questionId: string;
  questionLabel: string;
  answer: string | number | boolean;
  displayAnswer: string;
  message?: string;
}
export interface V1Submission {
  questionId: string;
  answer: string | number | boolean;
  message?: string;
}
export interface FormResponses {
  [pubkey: string]: {
    responses: Array<FormResponse>;
    authorName: string;
  };
}
export interface FormResponse {
  response: Array<V1Response>;
  createdAt: string;
}
export interface IFormSettings {
  titleImageUrl?: string;
  description?: string;
  thankYouPage?: boolean;
  notifyNpubs?: Array<string>;
  publicForm?: boolean;
  disallowAnonymous?: boolean;
}
