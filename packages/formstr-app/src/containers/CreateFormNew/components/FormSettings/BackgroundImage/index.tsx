import React, { useState } from "react";
import { Box, Button, Drawer, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ImagePicker } from "../../BackgroundImagePicker";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography sx={{ fontSize: 14 }}>
        {t("builder.formSettings.backgroundImage")}
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder={t("builder.formSettings.customImageUrl")}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          variant="outlined"
          onClick={() => setDrawerOpen(true)}
          sx={{ minWidth: 40, px: 1 }}
        >
          ...
        </Button>
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: "100%", sm: 500 } } } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t("builder.formSettings.chooseBackground")}
          </Typography>
          <ImagePicker
            options={sampleBackgrounds}
            selectedUrl={value}
            onSelect={(url) => {
              onChange(url);
              setDrawerOpen(false);
            }}
          />
        </Box>
      </Drawer>
    </Box>
  );
};
