import { stripHtml, getOrderedFieldIds } from "../utils/helper";
import { NormalizedForm, SectionData } from "../types";

describe("stripHtml", () => {
  it("returns empty string for undefined input", () => {
    expect(stripHtml(undefined)).toBe("");
  });

  it("returns empty string for empty string input", () => {
    expect(stripHtml("")).toBe("");
  });

  it("returns plain text unchanged", () => {
    expect(stripHtml("Hello World")).toBe("Hello World");
  });

  it("strips simple HTML tags", () => {
    expect(stripHtml("<b>bold</b>")).toBe("bold");
  });

  it("strips nested HTML tags", () => {
    expect(stripHtml("<div><p>Hello <strong>World</strong></p></div>")).toBe(
      "Hello World"
    );
  });

  it("strips self-closing tags", () => {
    expect(stripHtml("Line1<br/>Line2")).toBe("Line1Line2");
  });

  it("strips tags with attributes", () => {
    expect(stripHtml('<a href="https://example.com">Link</a>')).toBe("Link");
  });

  it("normalizes multiple whitespace to single space", () => {
    expect(stripHtml("Hello    World")).toBe("Hello World");
  });

  it("trims leading and trailing whitespace", () => {
    expect(stripHtml("  Hello World  ")).toBe("Hello World");
  });

  it("handles mixed HTML, extra whitespace, and trimming", () => {
    expect(stripHtml("  <p>  Hello  <b>World</b>  </p>  ")).toBe(
      "Hello World"
    );
  });

  it("handles script tags (strips them as text)", () => {
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it("handles empty tags", () => {
    expect(stripHtml("<p></p><div></div>")).toBe("");
  });
});

describe("getOrderedFieldIds", () => {
  const makeForm = (
    fieldOrder: string[],
    sections?: SectionData[]
  ): NormalizedForm => ({
    id: "test",
    name: "Test Form",
    pubkey: "abc",
    fields: {},
    fieldOrder,
    sections,
    relays: [],
    settings: {},
  });

  it("returns fieldOrder when no sections exist", () => {
    const form = makeForm(["q1", "q2", "q3"]);
    expect(getOrderedFieldIds(form)).toEqual(["q1", "q2", "q3"]);
  });

  it("returns fieldOrder when sections array is empty", () => {
    const form = makeForm(["q1", "q2", "q3"], []);
    expect(getOrderedFieldIds(form)).toEqual(["q1", "q2", "q3"]);
  });

  it("returns fields ordered by section order", () => {
    const form = makeForm(["q1", "q2", "q3", "q4"], [
      {
        id: "s2",
        title: "Section 2",
        questionIds: ["q3", "q4"],
        order: 2,
      },
      {
        id: "s1",
        title: "Section 1",
        questionIds: ["q1", "q2"],
        order: 1,
      },
    ]);
    // Should sort by order: s1 (order=1) then s2 (order=2)
    expect(getOrderedFieldIds(form)).toEqual(["q1", "q2", "q3", "q4"]);
  });

  it("respects section order regardless of array position", () => {
    const form = makeForm(["q1", "q2", "q3"], [
      {
        id: "s3",
        title: "Third",
        questionIds: ["q3"],
        order: 10,
      },
      {
        id: "s1",
        title: "First",
        questionIds: ["q1"],
        order: 0,
      },
      {
        id: "s2",
        title: "Second",
        questionIds: ["q2"],
        order: 5,
      },
    ]);
    expect(getOrderedFieldIds(form)).toEqual(["q1", "q2", "q3"]);
  });

  it("handles single section", () => {
    const form = makeForm(["q1", "q2"], [
      {
        id: "s1",
        title: "Only",
        questionIds: ["q1", "q2"],
        order: 0,
      },
    ]);
    expect(getOrderedFieldIds(form)).toEqual(["q1", "q2"]);
  });
});
