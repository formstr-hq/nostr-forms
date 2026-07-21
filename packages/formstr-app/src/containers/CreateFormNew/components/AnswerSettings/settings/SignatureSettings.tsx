import { Box, Switch, TextField, Typography } from "@mui/material";
import React from "react";
import { IAnswerSettings } from "../types";
import { useTranslation } from "react-i18next";

interface SignatureSettingsProps {
  answerSettings: IAnswerSettings;
  handleAnswerSettings: (settings: IAnswerSettings) => void;
}

const propertySettingSx = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  my: 1.5,
  fontSize: 14,
};

export const SignatureSettings: React.FC<SignatureSettingsProps> = ({
  answerSettings,
  handleAnswerSettings,
}) => {
  const { t } = useTranslation();
  const sig = answerSettings.signature || {};

  const updateSignature = (key: string, value: any) => {
    handleAnswerSettings({
      ...answerSettings,
      signature: { ...sig, [key]: value },
    });
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}
    >
      <Box sx={propertySettingSx}>
        <Typography variant="body2" color="text.secondary">
          {t("builder.signatureSettings.eventKind")}
        </Typography>
        <TextField
          type="number"
          size="small"
          value={sig.kind === 0 ? 0 : sig.kind || 22157}
          onChange={(e) =>
            updateSignature(
              "kind",
              e.target.value === "" ? null : Number(e.target.value),
            )
          }
          slotProps={{ htmlInput: { min: 0 } }}
          sx={{ width: 120 }}
        />
      </Box>

      <Box sx={propertySettingSx}>
        <Typography variant="body2" color="text.secondary">
          {t("builder.signatureSettings.editableContent")}
        </Typography>
        <Switch
          checked={!!sig.editableContent}
          onChange={(_e, checked) =>
            updateSignature("editableContent", checked)
          }
        />
      </Box>

      <Box sx={propertySettingSx}>
        <Typography variant="body2" color="text.secondary">
          {t("builder.signatureSettings.editableKind")}
        </Typography>
        <Switch
          checked={!!sig.editableKind}
          onChange={(_e, checked) => updateSignature("editableKind", checked)}
        />
      </Box>

      <Box sx={{ ...propertySettingSx, alignItems: "flex-start" }}>
        <Typography variant="body2" color="text.secondary">
          {t("builder.signatureSettings.prefilledContent")}
        </Typography>
        <TextField
          multiline
          rows={3}
          size="small"
          value={sig.prefilledContent}
          onChange={(e) => updateSignature("prefilledContent", e.target.value)}
          placeholder={t("builder.signatureSettings.prefilledPlaceholder")}
          sx={{ flex: 1, ml: 2 }}
        />
      </Box>
      <Box sx={propertySettingSx}>
        <Typography variant="body2" color="text.secondary">
          {t("builder.signatureSettings.editableCreatedAt")}
        </Typography>
        <Switch
          checked={!!sig.editableCreatedAt}
          onChange={(_e, checked) =>
            updateSignature("editableCreatedAt", checked)
          }
        />
      </Box>
    </Box>
  );
};
