import { Box, TextField, Typography } from "@mui/material";
import { RangeRule, ValidationRuleTypes } from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

const rowSx = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  mb: 1,
};

function Range({ rule, onChange }: { rule?: RangeRule; onChange: Function }) {
  const { t } = useTranslation();
  return (
    <>
      <Box sx={rowSx}>
        <Typography variant="body2" color="text.secondary">
          {t("builder.validation.minNumber")}
        </Typography>
        <TextField
          type="number"
          size="small"
          value={rule?.min ?? ""}
          onChange={(e) =>
            onChange(ValidationRuleTypes.range, {
              min: e.target.value,
              max: rule?.max,
            })
          }
          sx={{ width: "50%" }}
        />
      </Box>
      <Box sx={rowSx}>
        <Typography variant="body2" color="text.secondary">
          {t("builder.validation.maxNumber")}
        </Typography>
        <TextField
          type="number"
          size="small"
          value={rule?.max ?? ""}
          onChange={(e) =>
            onChange(ValidationRuleTypes.range, {
              min: rule?.min,
              max: e.target.value,
            })
          }
          sx={{ width: "50%" }}
        />
      </Box>
    </>
  );
}

export default Range;
