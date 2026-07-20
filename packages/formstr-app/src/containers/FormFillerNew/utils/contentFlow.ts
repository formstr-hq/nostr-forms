import { Field } from "../../../nostr/types";
import { SectionData } from "../../CreateFormNew/providers/FormBuilder/typeDefs";

// Content item can be either a section or a group of individual questions
export interface ContentItem {
  type: "section" | "questions";
  id: string;
  title: string;
  description?: string;
  fields: Field[];
  sectionData?: SectionData;
}

/**
 * Builds the ordered flow of steps for the form filler.
 * - Without sections: a single step containing every field.
 * - With sections: unsectioned questions are grouped into a leading step,
 *   followed by one step per section (in section order). Empty sections
 *   are skipped.
 */
export const createContentFlow = (
  fields: Field[],
  sections: SectionData[],
  t: (key: string) => string,
): ContentItem[] => {
  if (!sections.length) {
    return [
      {
        type: "questions",
        id: "all-questions",
        title: t("common.labels.formQuestions"),
        fields,
      },
    ];
  }

  const contentItems: ContentItem[] = [];
  const sectionedQuestionIds = new Set(
    sections.flatMap((section) => section.questionIds),
  );

  // Unsectioned questions are grouped into a leading step
  const unsectionedFields = fields.filter(
    (field) => !sectionedQuestionIds.has(field[1]),
  );

  if (unsectionedFields.length > 0) {
    contentItems.push({
      type: "questions",
      id: "unsectioned-questions",
      title: t("common.labels.generalQuestions"),
      description: t("common.labels.generalQuestionsDescription"),
      fields: unsectionedFields,
    });
  }

  sections.forEach((section) => {
    const sectionQuestionIds = new Set(section.questionIds);
    const sectionFields = fields.filter((field) =>
      sectionQuestionIds.has(field[1]),
    );

    if (sectionFields.length > 0) {
      contentItems.push({
        type: "section",
        id: section.id,
        title: section.title,
        description: section.description,
        fields: sectionFields,
        sectionData: section,
      });
    }
  });

  return contentItems;
};

/**
 * Decides where a click on the step indicator can take the user.
 * - Backwards (or to a completed step): jump freely.
 * - Exactly one step forward: allowed via validation ("validate").
 * - Anything further ahead: not allowed ("none").
 */
export const stepClickAction = (
  stepIndex: number,
  currentStep: number,
  completedSteps: ReadonlySet<number>,
): "jump" | "validate" | "none" => {
  if (stepIndex < currentStep || completedSteps.has(stepIndex)) return "jump";
  if (stepIndex === currentStep + 1) return "validate";
  return "none";
};
