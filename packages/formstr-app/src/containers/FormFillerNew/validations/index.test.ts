import {
  isValueEmpty,
  validateFields,
  validateFieldValue,
  REQUIRED_MESSAGE,
} from ".";
import { Field } from "../../../nostr/types";

const textField = (
  id: string,
  config: Record<string, unknown> = {},
): Field =>
  [
    "field",
    id,
    "text",
    `${id} label`,
    "[]",
    JSON.stringify({ renderElement: "shortText", ...config }),
  ] as Field;

const numberField = (id: string, config: Record<string, unknown>): Field =>
  [
    "field",
    id,
    "number",
    `${id} label`,
    "[]",
    JSON.stringify({ renderElement: "number", ...config }),
  ] as Field;

describe("isValueEmpty", () => {
  it("treats undefined, null and empty-string answers as empty", () => {
    expect(isValueEmpty(undefined)).toBe(true);
    expect(isValueEmpty(null)).toBe(true);
    expect(isValueEmpty(["", undefined])).toBe(true);
  });

  it("treats any non-empty answer as filled", () => {
    expect(isValueEmpty(["hello", undefined])).toBe(false);
    expect(isValueEmpty(["0", undefined])).toBe(false);
  });
});

describe("validateFieldValue", () => {
  it("returns the required message for an unanswered required field", () => {
    const field = textField("q1", { required: true });
    expect(validateFieldValue(field, undefined)).toBe(REQUIRED_MESSAGE);
    expect(validateFieldValue(field, null)).toBe(REQUIRED_MESSAGE);
    expect(validateFieldValue(field, ["", undefined])).toBe(REQUIRED_MESSAGE);
  });

  it("passes a required field once it has an answer", () => {
    const field = textField("q1", { required: true });
    expect(validateFieldValue(field, ["hi", undefined])).toBeNull();
  });

  it("lets an optional field stay empty", () => {
    const field = textField("q1");
    expect(validateFieldValue(field, undefined)).toBeNull();
  });

  it("enforces a number range rule", () => {
    const field = numberField("q1", {
      validationRules: { range: { min: 2, max: 5 } },
    });
    expect(validateFieldValue(field, ["1", undefined])).toBe(
      "Please enter number more than 2",
    );
    expect(validateFieldValue(field, ["7", undefined])).toBe(
      "Please enter number less than 5",
    );
    expect(validateFieldValue(field, ["3", undefined])).toBeNull();
  });

  it("enforces min/max length rules", () => {
    const field = textField("q1", {
      validationRules: { min: { min: 3 }, max: { max: 5 } },
    });
    expect(validateFieldValue(field, ["ab", undefined])).toBe(
      "Please enter more than 3 chars",
    );
    expect(validateFieldValue(field, ["abcdef", undefined])).toBe(
      "Please enter less than 5 chars",
    );
    expect(validateFieldValue(field, ["abcd", undefined])).toBeNull();
  });

  it("enforces regex rules with a custom error message", () => {
    const field = textField("q1", {
      validationRules: {
        regex: { pattern: "^a+$", errorMessage: "only a's allowed" },
      },
    });
    expect(validateFieldValue(field, ["bbb", undefined])).toBe(
      "only a's allowed",
    );
    expect(validateFieldValue(field, ["aaa", undefined])).toBeNull();
  });

  it("enforces match rules", () => {
    const field = textField("q1", {
      validationRules: { match: { answer: "42" } },
    });
    expect(validateFieldValue(field, ["41", undefined])).toBe(
      "This is not the correct answer for this question",
    );
    expect(validateFieldValue(field, ["42", undefined])).toBeNull();
  });

  it("skips rule checks for empty optional values (like antd rules did)", () => {
    const field = textField("q1", {
      validationRules: { min: { min: 3 } },
    });
    expect(validateFieldValue(field, undefined)).toBeNull();
  });

  it("treats an unparseable field config as a plain optional field", () => {
    const field = ["field", "q1", "text", "label", "[]", "{oops"] as Field;
    expect(validateFieldValue(field, undefined)).toBeNull();
  });
});

describe("validateFields", () => {
  it("returns an error map containing only failing fields", () => {
    const fields = [
      textField("q1", { required: true }),
      textField("q2"),
      textField("q3", { required: true }),
    ];
    const errors = validateFields(fields, {
      q3: ["answered", undefined],
    });

    expect(errors).toEqual({ q1: REQUIRED_MESSAGE });
  });

  it("returns an empty map when everything passes", () => {
    const fields = [textField("q1", { required: true })];
    expect(
      validateFields(fields, { q1: ["ok", undefined] }),
    ).toEqual({});
  });
});
