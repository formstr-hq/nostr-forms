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
import GGUFFileSelector from '../GGUFFileSelector';
import { LLMProvider } from '../../services/webLLM/types';

const ModelSelector: React.FC<ModelSelectorProps> = ({
  model,
  setModel,
  availableModels,
  fetching,
  disabled,
  style,
  placeholder = "Select a model",
  provider = LLMProvider.OLLAMA,
  onFileSelected,
  loading = false,
}) => {
  // If using Wllama, show file selector instead of dropdown
  if (provider === LLMProvider.WLLAMA) {
    return (
      <GGUFFileSelector
        onFileSelected={async (file) => {
          setModel(file.name);
          if (onFileSelected) {
            await onFileSelected(file);
          }
        }}
        loading={loading || fetching}
        selectedFileName={model}
        placeholder="Select a GGUF file from your storage"
      />
    );
  }

  // For Ollama and other providers, show dropdown
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
