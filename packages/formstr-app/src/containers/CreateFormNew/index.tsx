import { useLocation } from "react-router-dom";
import FormBuilder from "./FormBuilder";
import useFormBuilderContext from "./hooks/useFormBuilderContext";
import { useEffect, useState } from "react";
import { HEADER_MENU_KEYS } from "./components/Header/config";
import { FormRenderer } from "../FormFillerNew/FormRenderer";
import { Form } from "antd";

function CreateForm() {
  const { state } = useLocation();
  const { initializeForm, saveDraft, selectedTab, getFormSpec, formSettings } =
    useFormBuilderContext();
  const [initialized, setInitialized] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (state && !initialized) {
      initializeForm(state);
    }
    setInitialized(true);
    return () => {
      if (initialized) {
        saveDraft();
      }
    };
  }, [state, initialized, initializeForm, saveDraft]);

  if (selectedTab === HEADER_MENU_KEYS.BUILDER) {
    return <FormBuilder />;
  }
  if (selectedTab === HEADER_MENU_KEYS.PREVIEW) {
    return (
      <FormRenderer
        formTemplate={getFormSpec()}
        form={form}
        footer={null}
        onInput={(questionId, answer, message) => {
          if (!answer || answer === "") {
            form.setFieldValue(questionId, null);
          } else {
            form.setFieldValue(questionId, [answer, message]);
          }
        }}
        formstrBranding={formSettings.formstrBranding}
        isPreview={true}
      />
    );
  }

  return null;
}

export default CreateForm;
