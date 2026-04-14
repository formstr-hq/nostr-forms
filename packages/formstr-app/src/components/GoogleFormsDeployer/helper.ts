import { makeTag } from "../../utils/utility";
import { GoogleFormQuestion } from "./index";
import { Field, Option } from "../../nostr/types";
import { AnswerTypes } from "../../nostr/types";

export const mapGoogleQuestionToField = (question: GoogleFormQuestion): Field => {
    const questionType = question.type?.toUpperCase() || "";
    const required = !!question.isRequired;
    const hasOptions = Array.isArray(question.options) && question.options.length > 0;
    const label = question.title || "Untitled question";

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