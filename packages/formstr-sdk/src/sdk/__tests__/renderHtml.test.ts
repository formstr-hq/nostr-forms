import { FormstrSDK } from "../FormstrSDK";
import type { NormalizedForm, NormalizedField, Tag } from "../types";

const sdk = new FormstrSDK();

/**
 * Helper to build a NormalizedForm for renderHtml testing.
 */
function makeNormalizedForm(overrides: Partial<NormalizedForm> = {}): NormalizedForm {
  return {
    id: "test-form",
    name: "Test Form",
    pubkey: "abc123",
    fields: {},
    fieldOrder: [],
    relays: [],
    settings: {},
    blocks: [],
    ...overrides,
  };
}

describe("FormstrSDK.renderHtml", () => {
  describe("basic form structure", () => {
    it("returns the form object with html property set", () => {
      const form = makeNormalizedForm();
      const result = sdk.renderHtml(form);
      expect(result.html).toBeDefined();
      expect(result.html!.form).toBeDefined();
    });

    it("wraps output in a <form> tag with correct id", () => {
      const form = makeNormalizedForm({ id: "my-form" });
      const result = sdk.renderHtml(form);
      expect(result.html!.form).toContain('id="form-my-form"');
    });

    it("includes a submit button with correct id", () => {
      const form = makeNormalizedForm({ id: "my-form" });
      const result = sdk.renderHtml(form);
      expect(result.html!.form).toContain('id="form-submit-my-form"');
      expect(result.html!.form).toContain("Submit");
    });
  });

  describe("text field rendering", () => {
    it("renders a text input with label", () => {
      const fields: Record<string, NormalizedField> = {
        q1: {
          id: "q1",
          type: "text",
          labelHtml: "Your Name",
          config: {},
        },
      };
      const form = makeNormalizedForm({
        fields,
        fieldOrder: ["q1"],
        blocks: [
          {
            type: "section",
            id: "default",
            title: undefined,
            description: undefined,
            questionIds: ["q1"],
            order: 0,
          },
        ],
      });

      const result = sdk.renderHtml(form);
      expect(result.html!.form).toContain("<label>Your Name</label>");
      expect(result.html!.form).toContain('type="text"');
      expect(result.html!.form).toContain('name="q1"');
    });
  });

  describe("option field rendering", () => {
    it("renders radio buttons for option fields", () => {
      const fields: Record<string, NormalizedField> = {
        q1: {
          id: "q1",
          type: "option",
          labelHtml: "Pick one",
          options: [
            { id: "opt1", labelHtml: "Yes" },
            { id: "opt2", labelHtml: "No" },
          ],
          config: {},
        },
      };
      const form = makeNormalizedForm({
        fields,
        fieldOrder: ["q1"],
        blocks: [
          {
            type: "section",
            id: "default",
            title: undefined,
            description: undefined,
            questionIds: ["q1"],
            order: 0,
          },
        ],
      });

      const result = sdk.renderHtml(form);
      expect(result.html!.form).toContain('class="option-group"');
      expect(result.html!.form).toContain("Pick one");
      expect(result.html!.form).toContain('type="radio"');
      expect(result.html!.form).toContain('value="opt1"');
      expect(result.html!.form).toContain('value="opt2"');
      expect(result.html!.form).toContain("Yes");
      expect(result.html!.form).toContain("No");
    });
  });

  describe("label field rendering", () => {
    it("renders label fields as <p> tags", () => {
      const fields: Record<string, NormalizedField> = {
        lbl1: {
          id: "lbl1",
          type: "label",
          labelHtml: "Important notice",
          config: {},
        },
      };
      const form = makeNormalizedForm({
        fields,
        fieldOrder: ["lbl1"],
        blocks: [
          {
            type: "section",
            id: "default",
            title: undefined,
            description: undefined,
            questionIds: ["lbl1"],
            order: 0,
          },
        ],
      });

      const result = sdk.renderHtml(form);
      expect(result.html!.form).toContain("<p>Important notice</p>");
    });
  });

  describe("grid field rendering", () => {
    it("renders a grid with radio buttons by default", () => {
      const fields: Record<string, NormalizedField> = {
        g1: {
          id: "g1",
          type: "grid",
          labelHtml: "Rate each item",
          options: {
            columns: [
              ["c1", "Good"],
              ["c2", "Bad"],
            ],
            rows: [
              ["r1", "Service"],
              ["r2", "Quality"],
            ],
          } as any,
          config: {},
        },
      };
      const form = makeNormalizedForm({
        fields,
        fieldOrder: ["g1"],
        blocks: [
          {
            type: "section",
            id: "default",
            title: undefined,
            description: undefined,
            questionIds: ["g1"],
            order: 0,
          },
        ],
      });

      const result = sdk.renderHtml(form);
      expect(result.html!.form).toContain('class="grid-table"');
      expect(result.html!.form).toContain("Rate each item");
      expect(result.html!.form).toContain("<th>Good</th>");
      expect(result.html!.form).toContain("<th>Bad</th>");
      expect(result.html!.form).toContain("<td>Service</td>");
      expect(result.html!.form).toContain("<td>Quality</td>");
      expect(result.html!.form).toContain('type="radio"');
      expect(result.html!.form).toContain('name="g1_r1"');
      expect(result.html!.form).toContain('value="c1"');
    });

    it("renders checkboxes when allowMultiplePerRow is true", () => {
      const fields: Record<string, NormalizedField> = {
        g1: {
          id: "g1",
          type: "grid",
          labelHtml: "Select all that apply",
          options: {
            columns: [["c1", "A"]],
            rows: [["r1", "Row"]],
          } as any,
          config: { allowMultiplePerRow: true },
        },
      };
      const form = makeNormalizedForm({
        fields,
        fieldOrder: ["g1"],
        blocks: [
          {
            type: "section",
            id: "default",
            title: undefined,
            description: undefined,
            questionIds: ["g1"],
            order: 0,
          },
        ],
      });

      const result = sdk.renderHtml(form);
      expect(result.html!.form).toContain('type="checkbox"');
    });
  });

  describe("intro block rendering", () => {
    it("renders intro block with title", () => {
      const form = makeNormalizedForm({
        blocks: [{ type: "intro", title: "Welcome", description: undefined }],
      });

      const result = sdk.renderHtml(form);
      expect(result.html!.form).toContain("form-intro");
      expect(result.html!.form).toContain('class="form-name"');
      expect(result.html!.form).toContain("Welcome");
    });

    it("renders intro block with description", () => {
      const form = makeNormalizedForm({
        blocks: [
          { type: "intro", title: undefined, description: "Please fill out" },
        ],
      });

      const result = sdk.renderHtml(form);
      expect(result.html!.form).toContain('class="form-description"');
      expect(result.html!.form).toContain("Please fill out");
    });
  });

  describe("section block rendering", () => {
    it("renders section with title and description", () => {
      const fields: Record<string, NormalizedField> = {
        q1: { id: "q1", type: "text", labelHtml: "Name", config: {} },
      };
      const form = makeNormalizedForm({
        fields,
        fieldOrder: ["q1"],
        blocks: [
          {
            type: "section",
            id: "s1",
            title: "Personal Info",
            description: "Tell us about yourself",
            questionIds: ["q1"],
            order: 0,
          },
        ],
      });

      const result = sdk.renderHtml(form);
      expect(result.html!.form).toContain('class="section-title"');
      expect(result.html!.form).toContain("Personal Info");
      expect(result.html!.form).toContain('class="section-description"');
      expect(result.html!.form).toContain("Tell us about yourself");
    });
  });

  describe("unknown field type", () => {
    it("renders empty string for unrecognized field types", () => {
      const fields: Record<string, NormalizedField> = {
        q1: {
          id: "q1",
          type: "unknown_type",
          labelHtml: "Mystery",
          config: {},
        },
      };
      const form = makeNormalizedForm({
        fields,
        fieldOrder: ["q1"],
        blocks: [
          {
            type: "section",
            id: "default",
            title: undefined,
            description: undefined,
            questionIds: ["q1"],
            order: 0,
          },
        ],
      });

      const result = sdk.renderHtml(form);
      // Should not contain the label since the field type is unknown
      expect(result.html!.form).not.toContain("Mystery");
    });
  });

  describe("mutates input form", () => {
    it("adds html property to the input form object (mutates in place)", () => {
      const form = makeNormalizedForm();
      expect(form.html).toBeUndefined();
      const result = sdk.renderHtml(form);
      // renderHtml mutates the input and also returns it
      expect(result).toBe(form);
      expect(form.html).toBeDefined();
    });
  });
});
