import { Input } from "antd";
import { useTranslation } from "react-i18next";

interface ShortTextProps {}

const shortText: React.FC<ShortTextProps> = () => {
  const { t } = useTranslation();
  return (
    <>
      <Input
        placeholder={t("builder.inputPreviews.shortTextPlaceholder")}
        bordered={false}
        disabled
        style={{
          paddingLeft: 0,
          // borderBottom: "0.5px solid black",
          borderRadius: 0,
        }}
      />
    </>
  );
};

export default shortText;
