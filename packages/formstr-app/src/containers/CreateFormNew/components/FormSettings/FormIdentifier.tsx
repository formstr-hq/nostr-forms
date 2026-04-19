import { Typography } from "antd";
import { useTranslation } from "react-i18next";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { ChangeEvent } from "react";

function FormIdentifier() {
  const { t } = useTranslation();
  const { updateFormSetting, formSettings } = useFormBuilderContext();
  const handleIdentifierChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateFormSetting({ ...formSettings, formId: e.target.value });
  };
  return (
    <>
      <input
        className="file-input"
        type="text"
        placeholder={t("builder.formSettings.formIdentifier")}
        value={formSettings.formId}
        onChange={handleIdentifierChange}
      />
    </>
  );
}

export default FormIdentifier;
