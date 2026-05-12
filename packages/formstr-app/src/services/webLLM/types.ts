import { GenerateParams, GenerateResult } from '../ollamaService';

export enum LLMProvider {
  OLLAMA = 'ollama',
  WEB_LLM = 'web_llm'
}

export interface TestConnectionResult {
  success: boolean;
  error?: string;
}

export interface FetchModelsResult {
  success: boolean;
  models?: any[];
  error?: string;
}

export interface ILLMService {
  generate(params: GenerateParams, onData?: (chunk: any) => void): Promise<GenerateResult>;
  testConnection(): Promise<TestConnectionResult>;
  fetchModels(): Promise<FetchModelsResult>;
  getConfig?(): any;
  setConfig?(config: any): void;
}
