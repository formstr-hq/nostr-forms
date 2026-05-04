import { getItem, LOCAL_STORAGE_KEYS } from '../../utils/localStorage';
import { ollamaService } from '../ollamaService';
import { webLLMService } from './webLLMService';
import { LLMProvider, ILLMService } from './types';

class LLMService implements ILLMService {
  get activeService(): ILLMService {
    const provider = getItem<LLMProvider>(LOCAL_STORAGE_KEYS.LLM_PROVIDER) || LLMProvider.OLLAMA;
    return (provider === LLMProvider.WEB_LLM ? webLLMService : ollamaService) as ILLMService;
  }

  async generate(params: any, onData?: any) {
    return this.activeService.generate(params, onData);
  }

  async testConnection() {
    return this.activeService.testConnection();
  }

  async fetchModels() {
    return this.activeService.fetchModels();
  }

  get provider(): LLMProvider {
    return getItem<LLMProvider>(LOCAL_STORAGE_KEYS.LLM_PROVIDER) || LLMProvider.OLLAMA;
  }
}

export const llmService = new LLMService();
export { LLMProvider };
