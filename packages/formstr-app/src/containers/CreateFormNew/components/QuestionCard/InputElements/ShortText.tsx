import { TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

interface ShortTextProps {}

const shortText: React.FC<ShortTextProps> = () => {
  const { t } = useTranslation();
  return (
    <TextField
      placeholder={t("builder.inputPreviews.shortTextPlaceholder")}
      variant="standard"
      fullWidth
      disabled
      slotProps={{
        input: {
          disableUnderline: true,
          sx: {
            pl: 0,
            borderRadius: 0,
          },
        },
      }}
    />
  );
};

export default shortText;
