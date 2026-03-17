import { SectionData } from "../../providers/FormBuilder/typeDefs";

export interface IColorSettings {
  global?: string;
  title?: string;
  description?: string;
  question?: string;
}

export interface IFormSettings {
  titleImageUrl?: string;
  description?: string;
  thankYouPage?: boolean;
  notifyNpubs?: string[];
  publicForm?: boolean;
  disallowAnonymous?: boolean;
  encryptForm?: boolean;
  viewKeyInUrl?: boolean;
  formId?: string;
  sections?: SectionData[];
  backgroundImageUrl?: string;
  cardTransparency?: number;
  /** @deprecated use colors.global instead */
  globalColor?: string;
  colors?: IColorSettings;
  thankYouScreenImageUrl?: string;
  formstrBranding?: boolean;
  nrpcPubkey?: string;
  nrpcMethod?: string;
  requireWebhookPass?: boolean;
  disablePreview?: boolean
}
