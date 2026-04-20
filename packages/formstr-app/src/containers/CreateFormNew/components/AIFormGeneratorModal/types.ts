import { OllamaModel } from '../../../../services/ollamaService';
import { ProcessedFormData } from './aiProcessor';

export interface AIContextField {
    type: string;
    label: string;
    required?: boolean;
    options?: string[];
}

export interface AIFormContext {
    title?: string;
    description?: string;
    fields: AIContextField[];
}

export interface AIFormGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFormGenerated: (processedData: ProcessedFormData) => void;
    currentFormContext?: AIFormContext;
}

export interface GenerationPanelProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    onGenerate: () => void;
    loading: boolean;
    disabled: boolean;
    hasExistingForm: boolean;
}