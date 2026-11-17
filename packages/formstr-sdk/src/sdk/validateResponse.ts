import type { GridOptions, NormalizedForm, ResponseSubmission } from "./types";

export function validateResponse(
  form: NormalizedForm,
  values: ResponseSubmission,
) {
  for (const id of form.fieldOrder) {
    const field = form.fields[id];

    // Grid validation
    if (field.type === "grid" && field.config.required) {
      const gridOptions = field.options as unknown as GridOptions;
      const storedValue = values[id];
      const responses: Record<string, string | string[]> = storedValue
        ? typeof storedValue === "string"
          ? (JSON.parse(storedValue) as Record<string, string | string[]>)
          : Array.isArray(storedValue)
          ? {}
          : storedValue
        : {};

      for (const [rowId] of gridOptions.rows) {
        if (
          !responses[rowId] ||
          responses[rowId] === "" ||
          responses[rowId].length === 0
        ) {
          throw new Error(
            `Required grid row missing: ${field.labelHtml} - ${rowId}`,
          );
        }
      }
    }

    // Standard required field validation
    if (field.config.required && !values[id]) {
      throw new Error(`Required field missing: ${id}`);
    }
  }
  return true;
}
