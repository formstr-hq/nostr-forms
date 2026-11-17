import React from "react";
import { useTranslation } from "react-i18next";
import ImageSetting from "../ImageSetting";
import { sampleBackgrounds } from "../constants";

interface Props {
  value?: string;
  onChange: (url: string) => void;
}

export const BackgroundImageSetting: React.FC<Props> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  return (
    <ImageSetting
      value={value}
      onChange={onChange}
      label={t("builder.formSettings.backgroundImage")}
      pickerTitle={t("builder.formSettings.chooseBackground")}
      options={sampleBackgrounds}
    />
  );
};
