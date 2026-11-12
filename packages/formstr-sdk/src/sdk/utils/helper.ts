import { NormalizedForm } from "../types";

export function stripHtml(input: string | undefined): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, "") // remove all HTML tags
    .replace(/\s+/g, " ") // normalize whitespace
    .trim();
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape a value for HTML text or a quoted attribute. Every value renderHtml
 * interpolates comes from a relay, so it's escaped: otherwise a form author
 * could inject markup (or attributes) into every page that embeds the form.
 */
export function escapeHtml(input: unknown): string {
  return String(input ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

export function getOrderedFieldIds(form: NormalizedForm): string[] {
  if (!form.sections || form.sections.length === 0) {
    return form.fieldOrder;
  }

  return [...form.sections]
    .sort((a, b) => a.order - b.order)
    .flatMap((section) => section.questionIds);
}
