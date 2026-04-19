import React, { useState } from "react";
import { Input, Drawer, Button, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { ImagePicker } from "../../BackgroundImagePicker";
import { FileImageOutlined } from "@ant-design/icons";
import { sampleBackgrounds } from "../constants";
const { Text } = Typography;

interface Props {
  value?: string;
  onChange: (url: string) => void;
}

export const BackgroundImageSetting: React.FC<Props> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ marginTop: 16 }}>
      <Text className="property-name">{t("builder.formSettings.backgroundImage")}</Text>
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <Input
          placeholder={t("builder.formSettings.customImageUrl")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
          selectedUrl={value}
          onSelect={(url) => {
            onChange(url);
            setDrawerOpen(false);
          }}
        />
      </Drawer>
    </div>
  );
};
