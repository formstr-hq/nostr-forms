import { AnswerTypes, Field, Option } from "../../../../nostr/types";
import { makeTag } from "../../../../utils/utility";

export interface OllamaFormData {
  title: string;
  description?: string;
  fields: OllamaFormField[];
}
interface OllamaFormField {
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
}
export interface ProcessedFormData {
  fields: Field[];
  formName?: string;
  description?: string;
}

const AI_TYPE_TO_INTERNAL_MAP: {
  [key: string]: { primitive: string; renderElement: AnswerTypes };
} = {
  ShortText: { primitive: "text", renderElement: AnswerTypes.shortText },
  LongText: { primitive: "text", renderElement: AnswerTypes.paragraph },
  Paragraph: { primitive: "text", renderElement: AnswerTypes.paragraph },
  Email: { primitive: "text", renderElement: AnswerTypes.shortText },
  Number: { primitive: "number", renderElement: AnswerTypes.number },
  SingleChoice: { primitive: "option", renderElement: AnswerTypes.radioButton },
  Checkbox: { primitive: "option", renderElement: AnswerTypes.checkboxes },
  Dropdown: { primitive: "option", renderElement: AnswerTypes.dropdown },
  Date: { primitive: "text", renderElement: AnswerTypes.date },
  Time: { primitive: "text", renderElement: AnswerTypes.time },
  Label: { primitive: "label", renderElement: AnswerTypes.label },
  default: { primitive: "text", renderElement: AnswerTypes.shortText },
};

const EMAIL_REGEX_PATTERN = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
export function processOllamaFormData(
  ollamaData: OllamaFormData,
): ProcessedFormData {
  if (!ollamaData || !Array.isArray(ollamaData.fields)) {
    console.error("Invalid ollamaData received in processor:", ollamaData);
    return {
      fields: [],
      formName: "Error Processing Form",
      description: "Received invalid data from AI.",
    };
  }
  const formName = (ollamaData.title || "").trim();
  const description = ollamaData.description || "";
  const sourceFields = ollamaData.fields;
  const processedFields: Field[] = [];
  const processedIndices = new Set<number>();

  sourceFields.forEach((aiField, i) => {
    if (processedIndices.has(i)) {
      return;
    }

    const uniqueId = makeTag(6);
    const aiFieldType = aiField.type || "text";
    let label = (aiField.label || "").trim();
    const labelLower = label.toLowerCase();
    let hasOptions =
      Array.isArray(aiField.options) && aiField.options.length > 0;
    const typeMappingLookup = AI_TYPE_TO_INTERNAL_MAP[aiFieldType];
    let typeMapping = typeMappingLookup || AI_TYPE_TO_INTERNAL_MAP.default;
    let primitiveType = typeMapping.primitive;
    let renderElement = typeMapping.renderElement;
    const isInitialMappingDefaultOrGeneric =
      !typeMappingLookup || aiFieldType === "text" || aiFieldType === "choice";
    if (isInitialMappingDefaultOrGeneric) {
      if (hasOptions) {
        if (
          labelLower.includes("check all") ||
          labelLower.includes("multiple") ||
          labelLower.includes("select several") ||
          labelLower.includes("checkbox")
        ) {
          typeMapping = AI_TYPE_TO_INTERNAL_MAP["Checkbox"];
        } else {
          typeMapping = AI_TYPE_TO_INTERNAL_MAP["SingleChoice"];
        }
      } else {
        if (
          labelLower.includes("date") ||
          labelLower.includes(" d.o.b") ||
          labelLower.includes("birth")
        ) {
          typeMapping = AI_TYPE_TO_INTERNAL_MAP["Date"];
        } else if (labelLower.includes("time")) {
          typeMapping = AI_TYPE_TO_INTERNAL_MAP["Time"];
        } else if (
          labelLower.includes("number") ||
          labelLower.includes("rating") ||
          labelLower.includes("quantity") ||
          labelLower.includes("age") ||
          labelLower.includes("numeric")
        ) {
          typeMapping = AI_TYPE_TO_INTERNAL_MAP["Number"];
        } else if (
          labelLower.includes("email") ||
          labelLower.includes("e-mail")
        ) {
          typeMapping = AI_TYPE_TO_INTERNAL_MAP["Email"];
        } else if (
          labelLower.includes("comment") ||
          labelLower.includes("feedback") ||
          labelLower.includes("address") ||
          labelLower.includes("paragraph") ||
          labelLower.includes("long text") ||
          labelLower.includes("description") ||
          labelLower.length > 80
        ) {
          typeMapping = AI_TYPE_TO_INTERNAL_MAP["LongText"];
        } else {
          typeMapping = AI_TYPE_TO_INTERNAL_MAP["ShortText"];
        }
      }
      primitiveType = typeMapping.primitive;
      renderElement = typeMapping.renderElement;
    }
    const config: any = {
      renderElement: renderElement,
      required: aiField.required || false,
      validationRules: {},
    };
    if (
      renderElement === AnswerTypes.shortText &&
      (labelLower.includes("email") ||
        labelLower.includes("e-mail") ||
        aiFieldType === "Email")
    ) {
      config.validationRules.regex = {
        pattern: EMAIL_REGEX_PATTERN,
        errorMessage: "Please enter a valid email address.",
      };
    }
    const configJson = JSON.stringify(config);
    let optionsJson = "[]";
    let optionsSource = hasOptions ? aiField.options : null;
    let fieldLabelToUse = label;

    if (
      primitiveType === "option" &&
      !hasOptions &&
      i + 1 < sourceFields.length
    ) {
      const nextAiField = sourceFields[i + 1];
      const nextLabel = nextAiField.label || "";
      const nextHasOptions =
        Array.isArray(nextAiField.options) && nextAiField.options.length > 0;
      if (
        nextHasOptions &&
        (nextLabel.startsWith("Untitled") || nextLabel === "")
      ) {
        console.warn(
          `Merging options from next field (index ${
            i + 1
          }) into current field "${label}" (index ${i})`,
        );
        optionsSource = nextAiField.options;
        fieldLabelToUse = label;
        processedIndices.add(i + 1);
      }
    }
    if (
      optionsSource &&
      Array.isArray(optionsSource) &&
      optionsSource.length > 0 &&
      (renderElement === AnswerTypes.radioButton ||
        renderElement === AnswerTypes.checkboxes ||
        renderElement === AnswerTypes.dropdown)
    ) {
      const mappedOptions: Option[] = optionsSource.map(
        (optionLabel: string) => [makeTag(6), optionLabel, JSON.stringify({})],
      );
      optionsJson = JSON.stringify(mappedOptions);
    } else if (
      optionsSource &&
      Array.isArray(optionsSource) &&
      optionsSource.length > 0
    ) {
      console.warn(
        `AI provided options for "${fieldLabelToUse}", but final type "${renderElement}" doesn't use them.`,
      );
    }
    const newField: Field = [
      "field",
      uniqueId,
      primitiveType,
      fieldLabelToUse,
      optionsJson,
      configJson,
    ];
    processedFields.push(newField);
  });
  return { fields: processedFields, formName, description };
}
