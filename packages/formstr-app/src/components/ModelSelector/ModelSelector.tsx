import React from 'react';
import {
  Box,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { ModelSelectorProps } from './types';

const ModelSelector: React.FC<ModelSelectorProps> = ({
  model,
  setModel,
  availableModels,
  fetching,
  disabled,
  style,
  placeholder = "Select a model"
}) => {
  const isDisabled = disabled || fetching;
  const hasModels = availableModels.length > 0;

  return (
    <FormControl size="small" style={style} disabled={isDisabled}>
      <Select
        value={hasModels && model ? model : ""}
        onChange={(e) => setModel(e.target.value)}
        displayEmpty
        aria-label="Select Ollama Model"
        renderValue={(value) => {
          if (fetching) return "Loading models...";
          if (!value) return <Typography color="text.disabled">{placeholder}</Typography>;
          return value as string;
        }}
      >
        {fetching && (
          <MenuItem disabled>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} />
              Loading models...
            </Box>
          </MenuItem>
        )}
        {!fetching && !hasModels && (
          <MenuItem disabled>
            {disabled ? "Connect to use AI" : "No models found"}
          </MenuItem>
        )}
        {availableModels.map((m) => (
          <MenuItem key={m.name} value={m.name}>
            {m.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ModelSelector;
