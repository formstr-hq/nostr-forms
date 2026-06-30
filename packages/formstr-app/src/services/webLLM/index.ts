import { getItem, LOCAL_STORAGE_KEYS } from '../../utils/localStorage';
import { ollamaService } from '../ollamaService';
import { wllamaService } from './wllamaService';
import { LLMProvider, ILLMService } from './types';
import type { GenerateParams, GenerateResult } from '../ollamaService';
import type { TestConnectionResult, FetchModelsResult } from './types';

class LLMService implements ILLMService {
  get activeService(): ILLMService {
    const provider = getItem<LLMProvider>(LOCAL_STORAGE_KEYS.LLM_PROVIDER) || LLMProvider.OLLAMA;
    return (
      provider === LLMProvider.WLLAMA ? wllamaService : ollamaService
    ) as ILLMService;
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    return this.activeService.generate(params);
  }

  async testConnection(): Promise<TestConnectionResult> {
    return this.activeService.testConnection();
  }

  async fetchModels(): Promise<FetchModelsResult> {
    return this.activeService.fetchModels();
  }

  get provider(): LLMProvider {
    return getItem<LLMProvider>(LOCAL_STORAGE_KEYS.LLM_PROVIDER) || LLMProvider.OLLAMA;
  }
}

export const llmService = new LLMService();
export { LLMProvider };
