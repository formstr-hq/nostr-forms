import React from "react";
import { Box, TextField, Tooltip, Typography } from "@mui/material";
import { NumberConstraint } from "../../../../../nostr/types";

interface Constraints {
  max?: number;
  min?: number;
}

interface NumberConstraintsProps {
  onConstraintsChange: (constraints: Constraints | null) => void;
  numberConstraints: NumberConstraint;
}

export const NumberConstraints: React.FC<NumberConstraintsProps> = ({
  onConstraintsChange,
  numberConstraints,
}) => {
  const [error, showError] = React.useState(false);
  const maxRef = React.useRef<HTMLInputElement | null>(null);
  const minRef = React.useRef<HTMLInputElement | null>(null);
  const handleOnChange = () => {
    const maxValue = maxRef.current?.value
      ? Number(maxRef.current.value)
      : undefined;
    const minValue = minRef.current?.value
      ? Number(minRef.current.value)
      : undefined;
    if (
      maxValue !== undefined &&
      minValue !== undefined &&
      maxValue < minValue
    ) {
      showError(true);
      onConstraintsChange(null);
    } else {
      showError(false);
      onConstraintsChange({
        max: maxValue,
        min: minValue,
      });
    }
  };
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Tooltip
        open={error}
        title={"Max value should be more than min value"}
        arrow
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2">
              {"Enter the minimum allowed number(optional)"}
            </Typography>
            <TextField
              defaultValue={numberConstraints?.min}
              inputRef={minRef}
              type="number"
              size="small"
              onChange={() => {
                handleOnChange();
              }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2">
              {"Enter the maximum allowed number(optional)"}
            </Typography>
            <TextField
              defaultValue={numberConstraints?.max}
              inputRef={maxRef}
              type="number"
              size="small"
              onChange={() => {
                handleOnChange();
              }}
            />
          </Box>
        </Box>
      </Tooltip>
    </Box>
  );
};
