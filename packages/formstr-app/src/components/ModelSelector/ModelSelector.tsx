import React from 'react';
import { Select, Spin, Empty } from 'antd';
import { ModelSelectorProps } from './types';
import GGUFFileSelector from '../GGUFFileSelector';
import { LLMProvider } from '../../services/webLLM/types';

const { Option } = Select;

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
  return (
    <Select
      style={style}
      value={model}
      onChange={setModel}
      loading={fetching}
      disabled={disabled || fetching}
      placeholder={fetching ? "Loading models..." : placeholder}
      notFoundContent={
        fetching ? <Spin size="small" /> :
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={disabled ? "Connect to use AI" : "No models found"} />
      }
      aria-label="Select Ollama Model"
    >
      {availableModels.map(m => (
        <Option key={m.name} value={m.name}>
          {m.name}
        </Option>
      ))}
    </Select>
  );
};

export default ModelSelector;