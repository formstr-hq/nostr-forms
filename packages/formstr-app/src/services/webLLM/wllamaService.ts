import { WllamaService } from 'wllama-service';
import type { ILLMService, TestConnectionResult, FetchModelsResult } from './types';
import type { GenerateParams, GenerateResult } from '../ollamaService';

const llm = new WllamaService({
  wasmPath: `${process.env.PUBLIC_URL}/wllama/wllama.wasm`,
  nCtx: 2048,
  nGpuLayers: 999,
});

class WllamaServiceAdapter implements ILLMService {
  async testConnection(): Promise<TestConnectionResult> {
    const result = llm.checkEnvironment();
    return { success: result.success, error: result.error };
  }

  async fetchModels(): Promise<FetchModelsResult> {
    return { success: true, models: [] };
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const result = await llm.generate({
      system: params.system,
      prompt: params.prompt,
      maxTokens: 512,
      temperature: 0.1,
    });
    return result.success
      ? { success: true, data: { response: result.text ?? '' } }
      : { success: false, error: result.error };
  }

  async loadGGUFFile(file: File, onProgress?: (p: number) => void): Promise<void> {
    const result = await llm.loadModel(file, onProgress);
    if (!result.success) throw new Error(result.error);
  }

  getConfig() { return { modelName: llm.currentModel }; }
  setConfig(_config: any) {}
  async unloadModel() { await llm.unload(); }
}

export const wllamaService = new WllamaServiceAdapter();