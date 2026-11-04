import React, { useMemo } from "react";
import { QuestionNode } from "../QuestionNode/QuestionNode";
import { IFormSettings } from "../../CreateFormNew/components/FormSettings/types";
import { Field, GridOptions, Option } from "../../../nostr/types";
import { FieldErrors, FormFieldValue, FormValues } from "../validations";

interface FormFieldsProps {
  fields: Array<Field>;
  handleInput: (questionId: string, answer: string, message?: string) => void;
  disabled?: boolean;
  values?: FormValues;
  errors?: FieldErrors;
  testId?: string;
  formSettings: IFormSettings;
  formAuthorPubkey?: string;
  formEditKey?: string;
  responderSecretKey?: Uint8Array;
  uploaderPubkey?: string;
}

interface FormFieldItemProps {
  field: Field;
  handleInput: (questionId: string, answer: string, message?: string) => void;
  disabled: boolean;
  value?: FormFieldValue;
  error?: string;
  testId: string;
  formSettings: IFormSettings;
  formAuthorPubkey?: string;
  formEditKey?: string;
  responderSecretKey?: Uint8Array;
  uploaderPubkey?: string;
}

/**
 * One question row, memoized so typing in a field only re-renders that field.
 * `values` is spread by the renderer on every keystroke, but each entry keeps
 * its identity, so the untouched rows bail out of rendering here.
 */
const FormFieldItem = React.memo(function FormFieldItem({
  field,
  handleInput,
  disabled,
  value,
  error,
  testId,
  formSettings,
  formAuthorPubkey,
  formEditKey,
  responderSecretKey,
  uploaderPubkey,
}: FormFieldItemProps) {
  const { fieldId, label, fieldConfig, options, gridOptions } = useMemo(() => {
    const [, fieldId, type, label, optionsString, config] = field;
    const fieldConfig = JSON.parse(config);
    let gridOptions: GridOptions | null;
    let options: Option[];
    if (type === "grid") {
      gridOptions = JSON.parse(optionsString || "{}");
      options = [];
    } else {
      options = JSON.parse(optionsString || "[]");
      gridOptions = null;
    }
    return { fieldId, label, fieldConfig, options, gridOptions };
  }, [field]);

  return (
    <div data-testid={`${testId}:form-item-${fieldId}`}>
      <QuestionNode
        required={fieldConfig.required || false}
        label={label}
        fieldConfig={fieldConfig}
        fieldId={fieldId}
        options={options}
        inputHandler={handleInput}
        disabled={disabled}
        value={value}
        error={error}
        testId={`${testId}:question-${fieldId}`}
        formSettings={formSettings}
        gridOptions={gridOptions}
        formAuthorPubkey={formAuthorPubkey}
        formEditKey={formEditKey}
        responderSecretKey={responderSecretKey}
        uploaderPubkey={uploaderPubkey}
      />
    </div>
  );
});

export const FormFields: React.FC<FormFieldsProps> = ({
  fields,
  handleInput,
  disabled = false,
  values = {},
  errors,
  testId = "form-fields",
  formSettings,
  formAuthorPubkey,
  formEditKey,
  responderSecretKey,
  uploaderPubkey,
}) => {
  return fields.map((field) => (
    <FormFieldItem
      key={field[1]}
      field={field}
      handleInput={handleInput}
      disabled={disabled}
      value={values[field[1]]}
      error={errors?.[field[1]]}
      testId={testId}
      formSettings={formSettings}
      formAuthorPubkey={formAuthorPubkey}
      formEditKey={formEditKey}
      responderSecretKey={responderSecretKey}
      uploaderPubkey={uploaderPubkey}
    />
  ));
};
