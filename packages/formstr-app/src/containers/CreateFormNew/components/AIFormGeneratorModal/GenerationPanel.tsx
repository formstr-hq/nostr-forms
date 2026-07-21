import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { GenerationPanelProps } from "./types";
import { useTranslation } from "react-i18next";

const GenerationPanel: React.FC<GenerationPanelProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  loading,
  disabled,
}) => {
  const { t } = useTranslation();
  const placeholderText = t("builder.aiGenerator.placeholder");
  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography sx={{ fontWeight: 600 }}>
          {t("builder.aiGenerator.describeTitle")}
        </Typography>
        <Tooltip title={t("builder.aiGenerator.describeHelp")}>
          <InfoOutlinedIcon
            sx={{ ml: 1, color: "text.disabled", cursor: "help", fontSize: 18 }}
          />
        </Tooltip>
      </Box>
      <TextField
        multiline
        rows={5}
        fullWidth
        placeholder={placeholderText}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={loading || disabled}
        slotProps={{
          htmlInput: { "aria-label": t("builder.aiGenerator.ariaLabel") },
        }}
        sx={{ mb: 1 }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0, mb: 2 }}>
        {t("builder.aiGenerator.hint")}
      </Typography>
      <Button
        variant="contained"
        fullWidth
        onClick={onGenerate}
        disabled={disabled || !prompt.trim() || loading}
        startIcon={loading ? <CircularProgress size={16} /> : undefined}
      >
        {loading
          ? t("builder.aiGenerator.generating")
          : t("builder.aiGenerator.generateForm")}
      </Button>
    </Box>
  );
};

export default GenerationPanel;
