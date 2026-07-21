import { Box, TextField, Typography } from "@mui/material";
import React from "react";
import { IAnswerSettings } from "../types";

interface RatingSettingsProps {
  answerSettings: IAnswerSettings;
  handleAnswerSettings: (settings: IAnswerSettings) => void;
}

export const RatingSettings: React.FC<RatingSettingsProps> = ({
  answerSettings,
  handleAnswerSettings,
}) => {
  const maxStars = (answerSettings.maxStars as number | undefined) || 5;

  const updateMaxStars = (value: number | null) => {
    handleAnswerSettings({
      ...answerSettings,
      maxStars: value || 5,
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          my: 1.5,
          fontSize: 14,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Max Stars
        </Typography>
        <TextField
          type="number"
          size="small"
          value={maxStars}
          onChange={(e) =>
            updateMaxStars(
              e.target.value === "" ? null : Number(e.target.value),
            )
          }
          slotProps={{ htmlInput: { min: 3, max: 10 } }}
          sx={{ width: 100 }}
        />
      </Box>
    </Box>
  );
};
