import { Box, TextField, Typography } from "@mui/material";
import { MaxRule, ValidationRuleTypes } from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

function Max({ rule, onChange }: { rule?: MaxRule; onChange: Function }) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {t("builder.validation.maxLength")}
      </Typography>
      <TextField
        type="number"
        size="small"
        value={rule?.max ?? ""}
        onChange={(e) =>
          onChange(ValidationRuleTypes.max, { max: e.target.value })
        }
        sx={{ width: "50%" }}
      />
    </Box>
  );
}

export default Max;
