import { createContentFlow, stepClickAction } from "./contentFlow";
import { Field } from "../../../nostr/types";
import { SectionData } from "../../CreateFormNew/providers/FormBuilder/typeDefs";

const t = (key: string) => key;

const field = (id: string, label = id): Field =>
  ["field", id, label, "text"] as unknown as Field;

const section = (id: string, questionIds: string[], title = id): SectionData =>
  ({ id, title, questionIds }) as SectionData;

describe("createContentFlow", () => {
  it("returns a single step with all fields when there are no sections", () => {
    const flow = createContentFlow([field("q1"), field("q2")], [], t);

    expect(flow).toHaveLength(1);
    expect(flow[0].type).toBe("questions");
    expect(flow[0].id).toBe("all-questions");
    expect(flow[0].fields.map((f) => f[1])).toEqual(["q1", "q2"]);
  });

  it("groups unsectioned questions into a leading step", () => {
    const flow = createContentFlow(
      [field("q1"), field("q2"), field("q3")],
      [section("s1", ["q3"], "Section One")],
      t,
    );

    expect(flow).toHaveLength(2);
    expect(flow[0].type).toBe("questions");
    expect(flow[0].fields.map((f) => f[1])).toEqual(["q1", "q2"]);
    expect(flow[1].type).toBe("section");
    expect(flow[1].title).toBe("Section One");
    expect(flow[1].fields.map((f) => f[1])).toEqual(["q3"]);
  });

  it("keeps sections in their declared order", () => {
    const flow = createContentFlow(
      [field("q1"), field("q2"), field("q3")],
      [section("s2", ["q3"], "Second"), section("s1", ["q1", "q2"], "First")],
      t,
    );

    expect(flow.map((item) => item.title)).toEqual(["Second", "First"]);
  });

  it("skips sections that match no fields", () => {
    const flow = createContentFlow(
      [field("q1")],
      [
        section("s1", ["missing-question"], "Ghost"),
        section("s2", ["q1"], "Real"),
      ],
      t,
    );

    expect(flow).toHaveLength(1);
    expect(flow[0].id).toBe("s2");
  });

  it("omits the unsectioned group when every question is sectioned", () => {
    const flow = createContentFlow(
      [field("q1"), field("q2")],
      [section("s1", ["q1", "q2"])],
      t,
    );

    expect(flow).toHaveLength(1);
    expect(flow[0].type).toBe("section");
  });
});

describe("stepClickAction", () => {
  const completed = new Set<number>();

  it("allows jumping back to an earlier step", () => {
    expect(stepClickAction(0, 2, completed)).toBe("jump");
  });

  it("allows jumping to a completed step", () => {
    expect(stepClickAction(2, 0, new Set([2]))).toBe("jump");
  });

  it("requires validation to move exactly one step forward", () => {
    expect(stepClickAction(1, 0, completed)).toBe("validate");
  });

  it("rejects skipping ahead more than one step", () => {
    expect(stepClickAction(2, 0, completed)).toBe("none");
    expect(stepClickAction(3, 0, completed)).toBe("none");
  });

  it("ignores clicking the current step", () => {
    expect(stepClickAction(1, 1, completed)).toBe("none");
  });
});
