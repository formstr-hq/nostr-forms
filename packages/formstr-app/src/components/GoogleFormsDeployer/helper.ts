import { makeTag } from "../../utils/utility";
import { GoogleFormQuestion } from "./index";
import { Field, Option } from "../../nostr/types";
import { AnswerTypes } from "../../nostr/types";
import { SectionData } from "../../containers/CreateFormNew/providers/FormBuilder/typeDefs";

type SectionBucket = {
  title: string;
  description?: string;
  ids: string[];
};

export const mapGoogleQuestionToField = (question: GoogleFormQuestion): Field => {
    const questionType = question.type?.toUpperCase() || "";
    const required = !!question.isRequired;
    const hasOptions = Array.isArray(question.options) && question.options.length > 0;
    const label = question.title || "Untitled question";

    if (questionType === "SECTION_HEADER") {
      const headerLabel =
        (question.title || "").trim() ||
        (question.helpText || "").trim() ||
        "Section";
      return [
        "field",
        makeTag(6),
        "label",
        headerLabel,
        "[]",
        JSON.stringify({ renderElement: AnswerTypes.label, required: false }),
      ];
    }

    if (questionType === "IMAGE" || questionType === "VIDEO") {
      const titleOnly = (question.title || "").trim();
      const help = (question.helpText || "").trim();
      const emptyHint =
        questionType === "VIDEO"
          ? "*Video — re-add the clip in the builder if needed.*"
          : "*Image — re-add the picture in the builder if needed.*";
      const labelBody =
        titleOnly && help
          ? `${titleOnly}\n\n${help}`
          : titleOnly || help || emptyHint;
      return [
        "field",
        makeTag(6),
        "label",
        labelBody,
        "[]",
        JSON.stringify({ renderElement: AnswerTypes.label, required: false }),
      ];
    }

    const mapChoiceOptions = (options: string[]): Option[] =>
      options.map((optionLabel) => [makeTag(6), optionLabel, JSON.stringify({})]);

    if (questionType === "GRID" || questionType === "CHECKBOX_GRID") {
      const rows = (question.rows || []).map((rowLabel) => [
        makeTag(6),
        rowLabel,
        JSON.stringify({}),
      ]);
      const columns = (question.columns || []).map((columnLabel) => [
        makeTag(6),
        columnLabel,
        JSON.stringify({}),
      ]);
      return [
        "field",
        makeTag(6),
        "grid",
        label,
        JSON.stringify({ rows, columns }),
        JSON.stringify({
          renderElement:
            questionType === "CHECKBOX_GRID"
              ? AnswerTypes.checkboxGrid
              : AnswerTypes.multipleChoiceGrid,
          required,
          allowMultiplePerRow: questionType === "CHECKBOX_GRID",
        }),
      ];
    }

    if (questionType === "FILE_UPLOAD") {
      return [
        "field",
        makeTag(6),
        "file",
        label,
        "[]",
        JSON.stringify({
          renderElement: AnswerTypes.fileUpload,
          required,
          blossomServer: "https://nostr.download",
          maxFileSize: question.maxFileSizeBytes
            ? Math.max(1, Math.ceil(question.maxFileSizeBytes / (1024 * 1024)))
            : 10,
          allowedTypes: question.allowedFileTypes || [],
          maxFiles: question.maxFiles || 1,
        }),
      ];
    }

    if (questionType === "MULTIPLE_CHOICE" || questionType === "CHECKBOX" || questionType === "LIST") {
      const renderElement =
        questionType === "CHECKBOX"
          ? AnswerTypes.checkboxes
          : questionType === "LIST"
            ? AnswerTypes.dropdown
            : AnswerTypes.radioButton;
      const mappedOptions: Option[] = mapChoiceOptions(question.options || []);
      return [
        "field",
        makeTag(6),
        "option",
        label,
        JSON.stringify(mappedOptions),
        JSON.stringify({ renderElement, required }),
      ];
    }

    if (questionType === "PARAGRAPH_TEXT") {
      return [
        "field",
        makeTag(6),
        "text",
        label,
        "[]",
        JSON.stringify({ renderElement: AnswerTypes.paragraph, required }),
      ];
    }

    if (questionType === "TIME") {
      return [
        "field",
        makeTag(6),
        "text",
        label,
        "[]",
        JSON.stringify({ renderElement: AnswerTypes.time, required }),
      ];
    }

    if (questionType === "DATE" || questionType === "DATETIME") {
      return [
        "field",
        makeTag(6),
        "text",
        label,
        "[]",
        JSON.stringify({
          renderElement:
            questionType === "DATETIME" ? AnswerTypes.datetime : AnswerTypes.date,
          required,
        }),
      ];
    }

    const renderElement = hasOptions ? AnswerTypes.radioButton : AnswerTypes.shortText;
    return [
      "field",
      makeTag(6),
      hasOptions ? "option" : "text",
      label,
      hasOptions
        ? JSON.stringify(mapChoiceOptions(question.options || []))
        : "[]",
      JSON.stringify({ renderElement, required }),
    ];
  };

export function mapGoogleFormQuestionsToFieldsAndSections(
  questions: GoogleFormQuestion[],
): { fields: Field[]; sections: SectionData[] } {
  const fields: Field[] = [];
  const buckets: SectionBucket[] = [];
  let current: SectionBucket = {
    title: "Section 1",
    description: undefined,
    ids: [],
  };
  let pageBreakCount = 0;

  for (const question of questions) {
    const questionType = question.type?.toUpperCase() || "";

    if (questionType === "PAGE_BREAK") {
      pageBreakCount += 1;
      const defaultTitle =
        current.ids.length > 0
          ? `Section ${buckets.length + 2}`
          : `Section ${buckets.length + 1}`;
      const title = (question.title || "").trim() || defaultTitle;
      const description = (question.helpText || "").trim() || undefined;

      if (current.ids.length === 0) {
        current.title = title;
        current.description = description;
      } else {
        buckets.push(current);
        current = { title, description, ids: [] };
      }
      continue;
    }

    const field = mapGoogleQuestionToField(question);
    current.ids.push(field[1]);
    fields.push(field);
  }

  if (current.ids.length > 0) {
    buckets.push(current);
  }

  if (pageBreakCount === 0 || buckets.length === 0) {
    return { fields, sections: [] };
  }

  const sections: SectionData[] = buckets.map((bucket, order) => ({
    id: makeTag(8),
    title: bucket.title,
    description: bucket.description,
    questionIds: bucket.ids,
    order,
  }));

  return { fields, sections };
}