import { WebLLM } from 'web-llm-runner';
import { ILLMService, TestConnectionResult, FetchModelsResult } from './types';
import { GenerateParams, GenerateResult } from '../ollamaService';

class WebLLMService implements ILLMService {
  private llm: WebLLM;
  private isInitialized: boolean = false;

  constructor() {
    this.llm = new WebLLM();
  }

  async testConnection(): Promise<TestConnectionResult> {
    // WebLLM is always "connected" if the browser supports WebGPU
    try {
      if (!(navigator as any).gpu) {
        return { success: false, error: 'WebGPU not supported in this browser.' };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async fetchModels(): Promise<FetchModelsResult> {
    try {
      const models = this.llm.models_available.map(id => ({ name: id }));
      return { success: true, models };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async downloadModel(modelId: string, onProgress?: (progress: string) => void): Promise<void> {
    await this.llm.download_model(modelId, onProgress);
    this.isInitialized = true;
  }

  async deleteModel(modelId: string): Promise<void> {
    await this.llm.delete_model(modelId);
  }

  async isModelCached(modelId: string): Promise<boolean> {
    return await this.llm.local_model_available(modelId);
  }

  async generate(params: GenerateParams, onData?: (chunk: any) => void): Promise<GenerateResult> {
    const combinedPrompt = params.system ? `${params.system}\n\n${params.prompt}` : params.prompt;
    console.log('LLM Combined Prompt:', combinedPrompt);
    try {
      if (!this.isInitialized && params.modelName) {
         // Auto-load if model name is provided but not initialized
         console.log('Auto-initializing WebLLM with model:', params.modelName);
         await this.llm.download_model(params.modelName);
         this.isInitialized = true;
      }

      let finalResponse = '';
      if (onData) {
        const stream = this.llm.generate_stream(combinedPrompt);
        for await (const chunk of stream) {
          finalResponse += chunk;
          onData({ response: chunk, done: false });
        }
        console.log('LLM Generation (Streamed):', finalResponse);
        return { success: true, data: { response: finalResponse } };
      } else {
        const response = await this.llm.generate_no_stream(combinedPrompt);
        console.log('LLM Generation:', response);
        return { success: true, data: { response } };
      }
    } catch (e: any) {
      console.error('LLM Error:', e);
      return { success: false, error: e.message };
    }
  }

  getConfig() {
    return { modelName: '' };
  }

  setConfig(config: any) {
    // No-op for now, model selection handled in UI
  }
}

export const webLLMService = new WebLLMService();
