export type IDeleteFormsTrigger = IDeleteFormsLocal;

export interface IDeleteFormsLocal {
  formKey: string;
  onDeleted: () => void;
  onCancel: () => void;
  style?: Record<string, string | number>;
  // When these are present, deletion also publishes a NIP-09 request to remove
  // the form event from relays (a real delete), not just from the local list.
  // `signingKey` must be the form's own author key.
  formPubkey?: string;
  formId?: string;
  signingKey?: string;
  relays?: string[];
}

export interface IDeleteFormsNostr {
  key: string;
  onDeleted: () => void;
  onCancel: () => void;
}

export interface StoredForm {
  id?: number;
  slug: string;
  pubkey: string;
  identifier: string;
  relays: string[]; // Stored as JSON in DB
  owner: string;
  viewKey?: string | null; // NEW FIELD
  expirationDate: string;
}
