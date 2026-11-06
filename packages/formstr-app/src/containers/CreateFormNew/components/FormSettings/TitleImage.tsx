import { useTranslation } from "react-i18next";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import ImageSetting from "./ImageSetting";
import { sampleBackgrounds } from "./constants";

export default function TitleImage({
  titleImageUrl,
}: {
  titleImageUrl?: string;
}) {
  const { t } = useTranslation();
  const { updateFormSetting } = useFormBuilderContext();
  return (
    <ImageSetting
      value={titleImageUrl}
      onChange={(url) => updateFormSetting({ titleImageUrl: url })}
      label={t("builder.formSettings.titleImage")}
      pickerTitle={t("builder.formSettings.chooseTitleImage")}
      options={sampleBackgrounds}
    />
  );
}
