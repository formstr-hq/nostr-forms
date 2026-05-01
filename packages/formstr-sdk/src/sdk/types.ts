export interface NormalizedForm {
  settings: any;
  id: string;
  name: string;
  pubkey: string;
  description?: string;
  fields: Record<string, NormalizedField>;
  html?: {
    form: string;
    attachSubmit?: (callback: (values: Record<string, any>) => void) => void;
  };
  sections?: SectionData[];
  fieldOrder: string[];
  blocks?: FormBlock[];
  relays: string[];
}

export type FormBlock = IntroBlock | SectionBlock;

export interface IntroBlock {
  type: "intro";
  title?: string;
  description?: string;
}

export interface SectionBlock {
  type: "section";
  id: string;
  title?: string;
  description?: string;
  questionIds: string[];
  order: number;
}

export interface Field {
  id: string;
  type: string; // "text", "option", "label", etc
  label: string;
  options?: { id: string; label: string }[];
  settings?: Record<string, any>;
}

export interface NormalizedField {
  id: string;
  type: string;
  labelHtml: string;
  options?: NormalizedOption[];
  config: FieldConfig;
  primitive?: "string" | "number" | "boolean";
}

export interface NormalizedOption {
  id: string;
  labelHtml: string;
  config?: any;
}

export interface FieldConfig {
  required?: boolean;
  renderElement?: string;
  multiple?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowMultiplePerRow?: boolean;
  requiredRows?: string[];
}

export interface GridOptions {
  columns: Array<[columnId: string, columnLabel: string, columnConfig?: string]>;
  rows: Array<[rowId: string, rowLabel: string, rowConfig?: string]>;
}

export type GridResponse = Record<string, string>; // rowId -> columnId(s)

export interface FormSettings {
  description?: string;
  titleImageUrl?: string;
  encryptForm?: boolean;
  viewKeyInUrl?: boolean;
  sections?: SectionData[];
  [key: string]: any;
}

export interface SectionData {
  id: string;
  title: string;
  description?: string;
  questionIds: string[];
  order: number;
}

export interface ResponseSubmission {
  [fieldId: string]: string | string[];
}

export type Tag = string[];

export interface FormsSigner {
  getPublicKey(): Promise<string>;
  signEvent(event: import("nostr-tools").EventTemplate): Promise<import("nostr-tools").Event>;
  nip44Encrypt(pubkey: string, plaintext: string): Promise<string>;
  nip44Decrypt(pubkey: string, ciphertext: string): Promise<string>;
}

export type RenderElement =
  | "shortText"
  | "paragraph"
  | "number"
  | "radioButton"
  | "checkboxes"
  | "dropdown"
  | "date"
  | "time"
  | "datetime"
  | "signature"
  | "fileUpload"
  | "label";

export interface FormField {
  label: string;
  type: RenderElement;
  options?: string[];
  required?: boolean;
}

export interface CreateFormOptions {
  relays?: string[];
  /** Provide to save the ephemeral keys in the user's encrypted MyForms list (kind 14083). */
  signer?: FormsSigner;
  /** Encrypt form fields into NIP-44 content. Defaults to true. Set to false to create a public form. */
  encrypt?: boolean;
}

export interface RelayPublishResult {
  accepted: string[];
  rejected: string[];
}

export interface CreateFormResult {
  naddr: string;
  signingKeyHex: string;
  /** Present only for encrypted forms; hex-encoded view key used to decrypt content. */
  viewKeyHex?: string;
  /** The signed kind-30168 form event — use to rebroadcast to rejected relays. */
  formEvent: import("nostr-tools").Event;
  /** Per-relay publish result for the kind-30168 form event. */
  formRelays: RelayPublishResult;
  /** Signed kind-14083 event. Present when a signer was provided. Client can cache
   *  this and republish if myFormsRelays shows failures. */
  myFormsEvent?: import("nostr-tools").Event;
  /** Per-relay publish result for the kind-14083 MyForms event. */
  myFormsRelays?: RelayPublishResult;
}

export interface MyFormSummary {
  naddr: string;
  formId: string;
  formPubkey: string;
  name: string;
  fieldCount: number;
  relay: string;
  /** Encoded nkeys for encrypted forms; undefined for public forms. */
  nkeys?: string;
}
