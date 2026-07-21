import { Box, TextField, Typography } from "@mui/material";
import { MinRule, ValidationRuleTypes } from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

function Min({ rule, onChange }: { rule?: MinRule; onChange: Function }) {
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
        {t("builder.validation.minLength")}
      </Typography>
      <TextField
        type="number"
        size="small"
        value={rule?.min ?? ""}
        onChange={(e) =>
          onChange(ValidationRuleTypes.min, { min: e.target.value })
        }
        sx={{ width: "50%" }}
      />
    </Box>
  );
}

export default Min;
