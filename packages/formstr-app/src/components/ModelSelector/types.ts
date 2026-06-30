import { OllamaModel } from "../../services/ollamaService";
import { LLMProvider } from "../../services/webLLM/types";

export interface ModelSelectorProps {
    model: string | undefined;
    setModel: (model: string) => void;
    availableModels: OllamaModel[];
    fetching: boolean;
    disabled: boolean;
    style?: React.CSSProperties;
    placeholder?: string;
    provider?: LLMProvider;
    onFileSelected?: (file: File) => Promise<void>;
    loading?: boolean;
}
