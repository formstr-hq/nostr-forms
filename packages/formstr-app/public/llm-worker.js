import { a as WebWorkerMLCEngineHandler } from './shared-C-4vgiWP.js';
import 'perf_hooks';
import 'ws';

// A handler that resides in the worker thread
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => {
    handler.onmessage(msg);
};
//# sourceMappingURL=llm-worker.js.map
