import { getItem, setItem, LOCAL_STORAGE_KEYS } from "./localStorage";

export interface ISubmission {
  formId: string;
  formPubkey: string;
  formName: string;
  relays: string[];
  submittedAt: string;
  anonymous: boolean;
  submittedAs?: string;
}

const submissionKey = (
  submission: Pick<ISubmission, "formPubkey" | "formId">,
) => `${submission.formPubkey}:${submission.formId}`;

export function getSubmissions(): ISubmission[] {
  return getItem<ISubmission[]>(LOCAL_STORAGE_KEYS.SUBMISSIONS) ?? [];
}

/** Upserts by form so resubmitting/editing a response updates its entry instead of duplicating it. */
export function recordSubmission(submission: ISubmission) {
  const existing = getSubmissions().filter(
    (s) => submissionKey(s) !== submissionKey(submission),
  );
  setItem(LOCAL_STORAGE_KEYS.SUBMISSIONS, [submission, ...existing]);
}
