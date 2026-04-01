import { validateResponse } from "../validateResponse";
import type { NormalizedForm, NormalizedField, GridOptions } from "../types";

/**
 * Helper to create a minimal NormalizedForm for testing.
 */
function makeForm(
  fields: Record<string, NormalizedField>,
  fieldOrder: string[]
): NormalizedForm {
  return {
    id: "test-form",
    name: "Test Form",
    pubkey: "abc123",
    fields,
    fieldOrder,
    relays: [],
    settings: {},
  };
}

function textField(
  id: string,
  opts: { required?: boolean } = {}
): NormalizedField {
  return {
    id,
    type: "text",
    labelHtml: `Question ${id}`,
    config: { required: opts.required },
  };
}

function optionField(
  id: string,
  opts: { required?: boolean } = {}
): NormalizedField {
  return {
    id,
    type: "option",
    labelHtml: `Choice ${id}`,
    options: [
      { id: "opt1", labelHtml: "Option 1" },
      { id: "opt2", labelHtml: "Option 2" },
    ],
    config: { required: opts.required },
  };
}

function gridField(
  id: string,
  opts: {
    required?: boolean;
    rows?: Array<[string, string]>;
    columns?: Array<[string, string]>;
  } = {}
): NormalizedField {
  const gridOptions: GridOptions = {
    rows: (opts.rows || [
      ["row1", "Row 1"],
      ["row2", "Row 2"],
    ]) as Array<[string, string]>,
    columns: (opts.columns || [
      ["col1", "Column 1"],
      ["col2", "Column 2"],
    ]) as Array<[string, string]>,
  };

  return {
    id,
    type: "grid",
    labelHtml: `Grid ${id}`,
    options: gridOptions as any,
    config: { required: opts.required },
  };
}

describe("validateResponse", () => {
  describe("non-required fields", () => {
    it("passes when no values are provided for optional fields", () => {
      const form = makeForm(
        { q1: textField("q1"), q2: optionField("q2") },
        ["q1", "q2"]
      );
      expect(validateResponse(form, {})).toBe(true);
    });

    it("passes when values are provided for optional fields", () => {
      const form = makeForm(
        { q1: textField("q1"), q2: optionField("q2") },
        ["q1", "q2"]
      );
      expect(
        validateResponse(form, { q1: "answer", q2: "opt1" })
      ).toBe(true);
    });
  });

  describe("required text fields", () => {
    it("throws when a required text field is missing", () => {
      const form = makeForm(
        { q1: textField("q1", { required: true }) },
        ["q1"]
      );
      expect(() => validateResponse(form, {})).toThrow(
        "Required field missing: q1"
      );
    });

    it("throws when a required text field is empty string", () => {
      const form = makeForm(
        { q1: textField("q1", { required: true }) },
        ["q1"]
      );
      expect(() => validateResponse(form, { q1: "" })).toThrow(
        "Required field missing: q1"
      );
    });

    it("passes when a required text field is provided", () => {
      const form = makeForm(
        { q1: textField("q1", { required: true }) },
        ["q1"]
      );
      expect(validateResponse(form, { q1: "answer" })).toBe(true);
    });
  });

  describe("required option fields", () => {
    it("throws when a required option field is missing", () => {
      const form = makeForm(
        { q1: optionField("q1", { required: true }) },
        ["q1"]
      );
      expect(() => validateResponse(form, {})).toThrow(
        "Required field missing: q1"
      );
    });

    it("passes when a required option field is provided", () => {
      const form = makeForm(
        { q1: optionField("q1", { required: true }) },
        ["q1"]
      );
      expect(validateResponse(form, { q1: "opt1" })).toBe(true);
    });
  });

  describe("mixed required and optional fields", () => {
    it("throws when any required field is missing", () => {
      const form = makeForm(
        {
          q1: textField("q1", { required: true }),
          q2: textField("q2"),
          q3: optionField("q3", { required: true }),
        },
        ["q1", "q2", "q3"]
      );
      // q1 is provided, q3 is required but missing
      expect(() =>
        validateResponse(form, { q1: "answer", q2: "optional" })
      ).toThrow("Required field missing: q3");
    });

    it("passes when all required fields are provided and optional are skipped", () => {
      const form = makeForm(
        {
          q1: textField("q1", { required: true }),
          q2: textField("q2"),
          q3: optionField("q3", { required: true }),
        },
        ["q1", "q2", "q3"]
      );
      expect(
        validateResponse(form, { q1: "answer", q3: "opt1" })
      ).toBe(true);
    });
  });

  describe("grid field validation", () => {
    it("throws when a required grid field has missing rows", () => {
      const form = makeForm(
        { g1: gridField("g1", { required: true }) },
        ["g1"]
      );
      // Provide only row1, missing row2
      expect(() =>
        validateResponse(form, { g1: JSON.stringify({ row1: "col1" }) })
      ).toThrow(/Required grid row missing/);
    });

    it("throws when a required grid row has empty string value", () => {
      const form = makeForm(
        { g1: gridField("g1", { required: true }) },
        ["g1"]
      );
      expect(() =>
        validateResponse(form, {
          g1: JSON.stringify({ row1: "col1", row2: "" }),
        })
      ).toThrow(/Required grid row missing/);
    });

    it("passes when all required grid rows are filled", () => {
      const form = makeForm(
        { g1: gridField("g1", { required: true }) },
        ["g1"]
      );
      expect(
        validateResponse(form, {
          g1: JSON.stringify({ row1: "col1", row2: "col2" }),
        })
      ).toBe(true);
    });

    it("passes when a non-required grid field is missing", () => {
      const form = makeForm(
        { g1: gridField("g1", { required: false }) },
        ["g1"]
      );
      expect(validateResponse(form, {})).toBe(true);
    });

    it("handles grid values passed as objects (not strings)", () => {
      const form = makeForm(
        { g1: gridField("g1", { required: true }) },
        ["g1"]
      );
      // validateResponse also handles non-string values via typeof check
      expect(
        validateResponse(form, {
          g1: { row1: "col1", row2: "col2" } as any,
        })
      ).toBe(true);
    });
  });

  describe("empty form", () => {
    it("passes validation with no fields and no values", () => {
      const form = makeForm({}, []);
      expect(validateResponse(form, {})).toBe(true);
    });
  });
});
