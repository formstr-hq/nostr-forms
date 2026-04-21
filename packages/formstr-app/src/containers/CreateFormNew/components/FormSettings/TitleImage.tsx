import { Button, Drawer, Typography } from "antd";
import { useTranslation } from "react-i18next";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { ImagePicker } from "../BackgroundImagePicker";
import { sampleBackgrounds } from "./constants";
import { useState } from "react";

const { Text } = Typography;

function TitleImage({ titleImageUrl }: { titleImageUrl?: string }) {
  const { t } = useTranslation();
  const { updateFormTitleImage, updateFormSetting } = useFormBuilderContext();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  return (
    <>
      <div className="property-setting">
        <Text className="property-name">{t("builder.formSettings.titleImage")}</Text>
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <input
          className="file-input"
          type="text"
          value={titleImageUrl}
          onChange={updateFormTitleImage}
        />
        <Button onClick={() => setDrawerOpen(true)}>...</Button>
      </div>
      <Drawer
        title={t("builder.formSettings.chooseBackground")}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={500}
      >
        <ImagePicker
          options={sampleBackgrounds}
          selectedUrl={titleImageUrl}
          onSelect={(url: string) => {
            updateFormSetting({
              titleImageUrl: url,
            });
            setDrawerOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}

export default TitleImage;
