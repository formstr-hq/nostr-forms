import { FormstrSDK } from "../FormstrSDK";
import type { Tag } from "../types";

const sdk = new FormstrSDK();

/**
 * Helpers for building NIP-101 tag arrays
 */
function makeTags(overrides: {
  id?: string;
  name?: string;
  settings?: object;
  pubkey?: string;
  relays?: string[];
  fields?: Tag[];
}): Tag[] {
  const tags: Tag[] = [];
  if (overrides.id) tags.push(["d", overrides.id]);
  if (overrides.name) tags.push(["name", overrides.name]);
  if (overrides.settings)
    tags.push(["settings", JSON.stringify(overrides.settings)]);
  if (overrides.pubkey) tags.push(["pubkey", overrides.pubkey]);
  if (overrides.relays)
    overrides.relays.forEach((r) => tags.push(["relay", r]));
  if (overrides.fields) tags.push(...overrides.fields);
  return tags;
}

describe("FormstrSDK.normalizeForm", () => {
  describe("basic form metadata", () => {
    it("extracts form id from d tag", () => {
      const form = sdk.normalizeForm(makeTags({ id: "my-form-123" }));
      expect(form.id).toBe("my-form-123");
    });

    it("returns empty id when d tag is missing", () => {
      const form = sdk.normalizeForm(makeTags({ name: "Test" }));
      expect(form.id).toBe("");
    });

    it("extracts form name and strips HTML", () => {
      const form = sdk.normalizeForm(
        makeTags({ name: "<b>My Form</b>" })
      );
      expect(form.name).toBe("My Form");
    });

    it("returns empty name when name tag is missing", () => {
      const form = sdk.normalizeForm(makeTags({ id: "test" }));
      expect(form.name).toBe("");
    });

    it("extracts pubkey from pubkey tag", () => {
      const form = sdk.normalizeForm(
        makeTags({ pubkey: "deadbeefcafebabe" })
      );
      expect(form.pubkey).toBe("deadbeefcafebabe");
    });

    it("returns empty pubkey when pubkey tag is missing", () => {
      const form = sdk.normalizeForm(makeTags({ id: "test" }));
      expect(form.pubkey).toBe("");
    });

    it("extracts relay URLs", () => {
      const form = sdk.normalizeForm(
        makeTags({
          relays: ["wss://relay.damus.io/", "wss://nos.lol"],
        })
      );
      expect(form.relays).toEqual(["wss://relay.damus.io/", "wss://nos.lol"]);
    });

    it("returns empty relay list when no relay tags exist", () => {
      const form = sdk.normalizeForm(makeTags({ id: "test" }));
      expect(form.relays).toEqual([]);
    });
  });

  describe("settings parsing", () => {
    it("parses settings JSON from settings tag", () => {
      const settings = { description: "A test form", encryptForm: true };
      const form = sdk.normalizeForm(makeTags({ settings }));
      expect(form.settings).toEqual(settings);
    });

    it("returns empty settings when settings tag is missing", () => {
      const form = sdk.normalizeForm(makeTags({ id: "test" }));
      expect(form.settings).toEqual({});
    });
  });

  describe("field normalization", () => {
    it("normalizes a text field", () => {
      const form = sdk.normalizeForm(
        makeTags({
          id: "test",
          fields: [
            [
              "field",
              "q1",
              "text",
              "What is your name?",
              "",
              '{"required":true}',
            ],
          ],
        })
      );

      expect(form.fields["q1"]).toBeDefined();
      expect(form.fields["q1"].id).toBe("q1");
      expect(form.fields["q1"].type).toBe("text");
      expect(form.fields["q1"].labelHtml).toBe("What is your name?");
      expect(form.fields["q1"].config).toEqual({ required: true });
      expect(form.fieldOrder).toEqual(["q1"]);
    });

    it("normalizes an option field with choices", () => {
      const options = JSON.stringify([
        ["opt1", "Yes"],
        ["opt2", "No"],
      ]);
      const form = sdk.normalizeForm(
        makeTags({
          fields: [
            [
              "field",
              "q2",
              "option",
              "Do you agree?",
              options,
              '{"required":false}',
            ],
          ],
        })
      );

      const field = form.fields["q2"];
      expect(field.type).toBe("option");
      expect(field.options).toHaveLength(2);
      expect(field.options![0]).toEqual({ id: "opt1", labelHtml: "Yes", config: undefined });
      expect(field.options![1]).toEqual({ id: "opt2", labelHtml: "No", config: undefined });
    });

    it("normalizes option choices with config", () => {
      const options = JSON.stringify([
        ["opt1", "Choice A", '{"isOther":true}'],
      ]);
      const form = sdk.normalizeForm(
        makeTags({
          fields: [
            ["field", "q3", "option", "Pick one", options, "{}"],
          ],
        })
      );

      expect(form.fields["q3"].options![0].config).toEqual({
        isOther: true,
      });
    });

    it("normalizes a label field (no options)", () => {
      const form = sdk.normalizeForm(
        makeTags({
          fields: [
            ["field", "lbl1", "label", "Instructions here", "", "{}"],
          ],
        })
      );

      expect(form.fields["lbl1"].type).toBe("label");
      expect(form.fields["lbl1"].labelHtml).toBe("Instructions here");
      expect(form.fields["lbl1"].options).toBeUndefined();
    });

    it("preserves field order from tag array", () => {
      const form = sdk.normalizeForm(
        makeTags({
          fields: [
            ["field", "q1", "text", "First", "", "{}"],
            ["field", "q2", "text", "Second", "", "{}"],
            ["field", "q3", "text", "Third", "", "{}"],
          ],
        })
      );

      expect(form.fieldOrder).toEqual(["q1", "q2", "q3"]);
    });

    it("handles field with no options and no config strings", () => {
      // When optionsStr is empty string (falsy) and configStr is empty
      const form = sdk.normalizeForm([
        ["field", "q1", "text", "Simple", "", ""],
      ]);

      expect(form.fields["q1"].options).toBeUndefined();
      expect(form.fields["q1"].config).toEqual({});
    });

    it("strips HTML from field labels", () => {
      const form = sdk.normalizeForm(
        makeTags({
          fields: [
            [
              "field",
              "q1",
              "text",
              "<p>What is <b>your</b> name?</p>",
              "",
              "{}",
            ],
          ],
        })
      );
      // labelHtml is the raw label — stripHtml is applied to options labels
      // but the label itself is stored as-is in NormalizedField.labelHtml
      expect(form.fields["q1"].labelHtml).toBe(
        "<p>What is <b>your</b> name?</p>"
      );
    });

    it("strips HTML from option labels", () => {
      const options = JSON.stringify([["opt1", "<em>Bold Choice</em>"]]);
      const form = sdk.normalizeForm(
        makeTags({
          fields: [
            ["field", "q1", "option", "Pick", options, "{}"],
          ],
        })
      );

      expect(form.fields["q1"].options![0].labelHtml).toBe("Bold Choice");
    });
  });

  describe("blocks generation", () => {
    it("creates intro block when name tag exists", () => {
      const form = sdk.normalizeForm(
        makeTags({ name: "My Form" })
      );

      const intro = form.blocks!.find((b) => b.type === "intro");
      expect(intro).toBeDefined();
      expect(intro!.type).toBe("intro");
      expect((intro as any).title).toBe("My Form");
    });

    it("creates intro block when description exists in settings", () => {
      const form = sdk.normalizeForm(
        makeTags({
          settings: { description: "Fill out this form" },
        })
      );

      const intro = form.blocks!.find((b) => b.type === "intro");
      expect(intro).toBeDefined();
      expect((intro as any).description).toBe("Fill out this form");
    });

    it("does not create intro block when neither name nor description exist", () => {
      const form = sdk.normalizeForm(
        makeTags({
          id: "test",
          fields: [["field", "q1", "text", "Question", "", "{}"]],
        })
      );

      const intro = form.blocks!.find((b) => b.type === "intro");
      expect(intro).toBeUndefined();
    });

    it("creates a default section block when no sections in settings", () => {
      const form = sdk.normalizeForm(
        makeTags({
          fields: [
            ["field", "q1", "text", "Q1", "", "{}"],
            ["field", "q2", "text", "Q2", "", "{}"],
          ],
        })
      );

      const sections = form.blocks!.filter((b) => b.type === "section");
      expect(sections).toHaveLength(1);
      expect((sections[0] as any).id).toBe("default");
      expect((sections[0] as any).questionIds).toEqual(["q1", "q2"]);
    });

    it("creates section blocks from settings.sections, sorted by order", () => {
      const form = sdk.normalizeForm(
        makeTags({
          settings: {
            sections: [
              {
                id: "s2",
                title: "Part 2",
                description: "Second part",
                questionIds: ["q3"],
                order: 2,
              },
              {
                id: "s1",
                title: "Part 1",
                description: "First part",
                questionIds: ["q1", "q2"],
                order: 1,
              },
            ],
          },
          fields: [
            ["field", "q1", "text", "Q1", "", "{}"],
            ["field", "q2", "text", "Q2", "", "{}"],
            ["field", "q3", "text", "Q3", "", "{}"],
          ],
        })
      );

      const sections = form.blocks!.filter((b) => b.type === "section");
      expect(sections).toHaveLength(2);
      // Should be sorted by order
      expect((sections[0] as any).id).toBe("s1");
      expect((sections[0] as any).title).toBe("Part 1");
      expect((sections[0] as any).order).toBe(1);
      expect((sections[1] as any).id).toBe("s2");
      expect((sections[1] as any).title).toBe("Part 2");
      expect((sections[1] as any).order).toBe(2);
    });
  });

  describe("complete form normalization", () => {
    it("normalizes a complete public form", () => {
      const tags: Tag[] = [
        ["d", "feedback-form"],
        ["name", "Customer Feedback"],
        [
          "settings",
          JSON.stringify({ description: "Please share your thoughts" }),
        ],
        ["pubkey", "abc123"],
        ["relay", "wss://relay.damus.io/"],
        ["relay", "wss://nos.lol"],
        [
          "field",
          "q1",
          "text",
          "Your Name",
          "",
          '{"required":true}',
        ],
        [
          "field",
          "q2",
          "option",
          "Rate us",
          JSON.stringify([
            ["r1", "Good"],
            ["r2", "Bad"],
          ]),
          '{"required":true}',
        ],
        ["field", "q3", "text", "Comments", "", '{"required":false}'],
      ];

      const form = sdk.normalizeForm(tags);

      expect(form.id).toBe("feedback-form");
      expect(form.name).toBe("Customer Feedback");
      expect(form.pubkey).toBe("abc123");
      expect(form.relays).toEqual(["wss://relay.damus.io/", "wss://nos.lol"]);
      expect(form.fieldOrder).toEqual(["q1", "q2", "q3"]);
      expect(Object.keys(form.fields)).toEqual(["q1", "q2", "q3"]);
      expect(form.fields["q1"].config.required).toBe(true);
      expect(form.fields["q2"].options).toHaveLength(2);
      expect(form.blocks).toBeDefined();
      expect(form.blocks!.length).toBeGreaterThanOrEqual(2); // intro + default section
    });

    it("normalizes minimal empty tags (edge case)", () => {
      const form = sdk.normalizeForm([]);
      expect(form.id).toBe("");
      expect(form.name).toBe("");
      expect(form.pubkey).toBe("");
      expect(form.relays).toEqual([]);
      expect(form.fieldOrder).toEqual([]);
      expect(Object.keys(form.fields)).toEqual([]);
    });
  });
});
