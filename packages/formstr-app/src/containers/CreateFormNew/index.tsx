import { useLocation } from "react-router-dom";
import FormBuilder from "./FormBuilder";
import useFormBuilderContext from "./hooks/useFormBuilderContext";
import { useEffect, useRef, useState } from "react";
import { HEADER_MENU_KEYS } from "./components/Header/config";
import { FormRenderer } from "../FormFillerNew/FormRenderer";

function CreateForm() {
  const { state } = useLocation();
  const { initializeForm, saveDraft, selectedTab, getFormSpec, formSettings } =
    useFormBuilderContext();
  const [initialized, setInitialized] = useState(false);
  const lastFormIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state && state.id && state.id !== lastFormIdRef.current) {
      initializeForm(state);
      lastFormIdRef.current = state.id;
      setInitialized(true);
    }
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
      // The renderer self-manages preview values (antd Form removed in the
      // MUI rewrite); onInput is a no-op by design.
      <FormRenderer
        formTemplate={getFormSpec()}
        footer={null}
        onInput={() => {}}
        formstrBranding={formSettings.formstrBranding}
        isPreview={true}
      />
    );
  }

  return null;
}

export default CreateForm;
