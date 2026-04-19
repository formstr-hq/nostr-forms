import { Choice } from "./types";

/** Field[4] JSON may deserialize to non-arrays at runtime (API, drafts, bad data). */
export function normalizeChoices(raw: unknown): Array<Choice> {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as Array<Choice>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Array<Choice>) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export const addOption = (
  option: Choice,
  choices: Array<Choice>,
  callback: (choices: Array<Choice>) => void
) => {
  const safe = normalizeChoices(choices);
  let newChoices = [...safe, option];
  callback(newChoices);
};

export const handleDelete = (
  choiceId: string,
  choices: Array<Choice>,
  callback: (choices: Array<Choice>) => void
) => {
  const safe = normalizeChoices(choices);
  let newChoices = safe.filter((choice) => choice[0] !== choiceId);
  callback(newChoices);
};

export const handleLabelChange = (
  label: string,
  choiceId: string,
  choices: Array<Choice>,
  callback: (choices: Array<Choice>) => void
) => {
  const safe = normalizeChoices(choices);
  let newChoices = safe.map((choice) => {
    if (choice[0] === choiceId) {
      let newChoice = choice;
      newChoice[1] = label;
      return newChoice;
    }
    return choice;
  });
  callback(newChoices);
};

export const hasOtherOption = (choices: Array<Choice>) => {
  const safe = normalizeChoices(choices);
  return safe.some((choice) => {
    let settings = JSON.parse(choice[2] || "{}");
    return settings.isOther;
  });
};
