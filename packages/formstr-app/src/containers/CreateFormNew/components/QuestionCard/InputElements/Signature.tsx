import React from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { IAnswerSettings } from "../../AnswerSettings/types";
import { useTranslation } from "react-i18next";

interface SignatureInputProps {
  answerSettings: IAnswerSettings;
}

const SignatureInput: React.FC<SignatureInputProps> = ({ answerSettings }) => {
  const { t } = useTranslation();
  const sig = answerSettings.signature ?? {};

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        width: "100%",
        alignItems: "flex-start",
      }}
    >
      {sig.editableContent ? (
        // Case 1: Editable content
        <TextField
          value={sig.prefilledContent}
          placeholder={t("builder.inputPreviews.editContentToSign")}
          multiline
          rows={4}
          fullWidth
          disabled={true}
        />
      ) : sig.prefilledContent ? (
        // Case 2: Prefilled but not editable
        <Box
          sx={{
            backgroundColor: "#fafafa",
            border: "1px solid #e0e0e0",
            padding: "8px 12px",
            borderRadius: "6px",
            whiteSpace: "pre-wrap",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {sig.prefilledContent}
          </Typography>
        </Box>
      ) : (
        // Case 3: No prefilled content and not editable
        <Typography variant="body2" color="text.secondary">
          {t("builder.inputPreviews.noContentToSign")}
        </Typography>
      )}

      <Button variant="contained" onClick={() => {}}>
        {t("builder.inputPreviews.attachSignature")}
      </Button>
    </Box>
  );
};

export default SignatureInput;
