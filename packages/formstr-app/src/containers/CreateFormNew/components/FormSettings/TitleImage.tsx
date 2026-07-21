import { Box, Button, Drawer, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { ImagePicker } from "../BackgroundImagePicker";
import { sampleBackgrounds } from "./constants";
import { ChangeEvent, useState } from "react";

function TitleImage({ titleImageUrl }: { titleImageUrl?: string }) {
  const { t } = useTranslation();
  const { updateFormTitleImage, updateFormSetting } = useFormBuilderContext();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          my: 1.5,
        }}
      >
        <Typography sx={{ fontSize: 14 }}>
          {t("builder.formSettings.titleImage")}
        </Typography>
      </Box>
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
          value={titleImageUrl ?? ""}
          onChange={(e) =>
            updateFormTitleImage(e as ChangeEvent<HTMLInputElement>)
          }
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
            selectedUrl={titleImageUrl}
            onSelect={(url: string) => {
              updateFormSetting({
                titleImageUrl: url,
              });
              setDrawerOpen(false);
            }}
          />
        </Box>
      </Drawer>
    </>
  );
}

export default TitleImage;
