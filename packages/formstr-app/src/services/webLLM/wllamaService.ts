import { CacheManager, Wllama } from "@wllama/wllama/esm/index.js";
import type {
  ILLMService,
  TestConnectionResult,
  FetchModelsResult,
} from "./types";
import type { GenerateParams, GenerateResult } from "../ollamaService";

const WASM_PATH = `${process.env.PUBLIC_URL ?? ""}/wllama/wllama.wasm`;
const CONTEXT_SIZE = 2048;
const GPU_LAYERS = 999;

class InMemoryStorageBackend {
  private files = new Map<string, Blob>();

  isSupported(): boolean {
    return true;
  }

  read(key: string): Promise<Blob | null> {
    return Promise.resolve(this.files.get(key) ?? null);
  }

  async write(key: string, stream: ReadableStream): Promise<void> {
    this.files.set(key, await new Response(stream).blob());
  }

  getSize(key: string): Promise<number> {
    return Promise.resolve(this.files.get(key)?.size ?? -1);
  }

  list(): Promise<Array<{ key: string; size: number }>> {
    return Promise.resolve(
      Array.from(this.files, ([key, file]) => ({ key, size: file.size })),
    );
  }

  delete(key: string): Promise<void> {
    this.files.delete(key);
    return Promise.resolve();
  }
}

const createCacheManager = (): CacheManager => {
  try {
    return new CacheManager();
  } catch {
    // Capacitor WebViews may not expose OPFS. Local GGUF files do not need a
    // persistent cache, but Wllama still requires a supported cache backend.
    return new CacheManager([new InMemoryStorageBackend()]);
  }
};

class WllamaServiceAdapter implements ILLMService {
  private llm: Wllama | null = null;
  private modelName = "";

  private hasWebGPU(): boolean {
    return typeof navigator !== "undefined" && "gpu" in navigator;
  }

  testConnection(): Promise<TestConnectionResult> {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return Promise.resolve({
        success: false,
        error: "Wllama can only run in a browser environment.",
      });
    }

    if (typeof WebAssembly === "undefined") {
      return Promise.resolve({
        success: false,
        error: "WebAssembly is not supported in this browser.",
      });
    }

    return Promise.resolve({ success: true });
  }

  fetchModels(): Promise<FetchModelsResult> {
    return Promise.resolve({ success: true, models: [] });
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    if (!this.llm) {
      return {
        success: false,
        error: "No model loaded. Select a GGUF file first.",
      };
    }

    try {
      const messages: Array<{ role: "system" | "user"; content: string }> = [];
      if (params.system)
        messages.push({ role: "system", content: params.system });
      messages.push({ role: "user", content: params.prompt });

      const result = await this.llm.createChatCompletion({
        messages,
        stream: false,
        max_tokens: 512,
        temperature: 0.1,
        top_k: 40,
        top_p: 0.95,
      });

      return {
        success: true,
        data: { response: result.choices[0]?.message.content ?? "" },
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Generation failed",
      };
    }
  }

  async loadGGUFFile(
    file: File,
    onProgress?: (p: number) => void,
  ): Promise<void> {
    const environment = await this.testConnection();
    if (!environment.success) throw new Error(environment.error);

    await this.unloadModel();

    try {
      onProgress?.(10);
      this.llm = new Wllama(
        { default: WASM_PATH },
        { cacheManager: createCacheManager() },
      );
      onProgress?.(30);

      await this.llm.loadModel([file], {
        n_ctx: CONTEXT_SIZE,
        n_gpu_layers: this.hasWebGPU() ? GPU_LAYERS : 0,
        jinja: true,
      });

      this.modelName = file.name;
      onProgress?.(100);
    } catch (error: unknown) {
      await this.unloadModel();
      throw error instanceof Error ? error : new Error("Failed to load model");
    }
  }

  getConfig() {
    return { modelName: this.modelName };
  }
  setConfig(config: { modelName?: string }) {
    if (this.llm && config.modelName !== undefined) {
      this.modelName = config.modelName;
    }
  }
  async unloadModel() {
    if (this.llm) {
      try {
        await this.llm.exit();
      } catch {
        // Ignore shutdown errors while releasing the current model.
      }
      this.llm = null;
    }
    this.modelName = "";
  }
}

export const wllamaService = new WllamaServiceAdapter();
