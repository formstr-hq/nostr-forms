import React from "react";
import { useTranslation } from "react-i18next";
import ImageSetting from "../ImageSetting";
import { sampleThankYouScreens } from "../constants";

interface Props {
  value?: string;
  onChange: (url: string) => void;
}

export const ThankYouScreenImageSetting: React.FC<Props> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  return (
    <ImageSetting
      value={value}
      onChange={onChange}
      label={t("builder.formSettings.thankYouImage")}
      pickerTitle={t("builder.formSettings.chooseThankYouImage")}
      options={sampleThankYouScreens}
    />
  );
};
