import { WebWorkerMLCEngineHandler } from 'web-llm-runner';

const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg) => {
  handler.onmessage(msg);
};