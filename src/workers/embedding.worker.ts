/**
 * Embedding Worker
 *
 * Runs Transformers.js in a Web Worker for non-blocking embedding generation.
 * Uses @huggingface/transformers v3 with WASM backend.
 */

/// <reference lib="webworker" />

declare const self: DedicatedWorkerGlobalScope;

// Types for the worker API
interface EmbeddingResult {
  id: string;
  text: string;
  vector: number[];
}

interface ProgressCallback {
  (progress: { status: string; progress?: number; file?: string }): void;
}

// Lazy-loaded pipeline
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Transformers.js pipeline has dynamic return type
let pipeline: any = null;
let currentModelId: string | null = null;

/**
 * Load the embedding model
 */
async function loadModel(
  modelId: string,
  onProgress?: ProgressCallback
): Promise<void> {
  // Skip if already loaded
  if (pipeline && currentModelId === modelId) {
    return;
  }

  onProgress?.({ status: "loading", progress: 0 });

  try {
    // Dynamic import to load transformers only when needed
    const transformers = await import("@huggingface/transformers");
    const { pipeline: createPipeline, env } = transformers;

    // Configure for browser
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    onProgress?.({ status: "downloading", progress: 10 });

    // Create feature extraction pipeline
    pipeline = await createPipeline("feature-extraction", modelId, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Transformers.js callback type
      progress_callback: (progress: { status: string; progress?: number; file?: string }) => {
        if (progress.status === "progress") {
          onProgress?.({
            status: "downloading",
            progress: progress.progress,
            file: progress.file,
          });
        }
      },
    });

    currentModelId = modelId;
    onProgress?.({ status: "ready", progress: 100 });
  } catch (error) {
    onProgress?.({ status: "error", progress: 0 });
    throw error;
  }
}

/**
 * Generate embeddings for a batch of texts
 */
async function embed(
  texts: string[],
  options?: {
    pooling?: "mean" | "cls";
    normalize?: boolean;
  }
): Promise<number[][]> {
  if (!pipeline) {
    throw new Error("Model not loaded. Call loadModel first.");
  }

  const { pooling = "mean", normalize = true } = options || {};

  // Generate embeddings
  const outputs = await pipeline(texts, {
    pooling,
    normalize,
  });

  // Convert to array of arrays
  return outputs.tolist();
}

/**
 * Generate embeddings with IDs for storage
 */
async function embedWithIds(
  items: Array<{ id: string; text: string }>,
  options?: {
    pooling?: "mean" | "cls";
    normalize?: boolean;
    batchSize?: number;
  }
): Promise<EmbeddingResult[]> {
  if (!pipeline) {
    throw new Error("Model not loaded. Call loadModel first.");
  }

  const { batchSize = 32, ...embedOptions } = options || {};
  const results: EmbeddingResult[] = [];

  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const texts = batch.map((item) => item.text);

    const embeddings = await embed(texts, embedOptions);

    batch.forEach((item, idx) => {
      results.push({
        id: item.id,
        text: item.text,
        vector: embeddings[idx],
      });
    });

    // Report progress
    self.postMessage({
      type: "progress",
      current: Math.min(i + batchSize, items.length),
      total: items.length,
    });
  }

  return results;
}

/**
 * Get the current model info
 */
function getModelInfo(): { modelId: string | null; isLoaded: boolean } {
  return {
    modelId: currentModelId,
    isLoaded: pipeline !== null,
  };
}

/**
 * Unload the current model to free memory
 */
async function unloadModel(): Promise<void> {
  pipeline = null;
  currentModelId = null;
}

// Message handler
self.onmessage = async (event: MessageEvent) => {
  const { id, method, args } = event.data;

  try {
    let result: unknown;

    switch (method) {
      case "loadModel":
        // Handle progress callback specially
        await loadModel(args[0], (progress) => {
          self.postMessage({ type: "progress", id, progress });
        });
        result = undefined;
        break;

      case "embed":
        result = await embed(args[0], args[1]);
        break;

      case "embedWithIds":
        result = await embedWithIds(args[0], args[1]);
        break;

      case "getModelInfo":
        result = getModelInfo();
        break;

      case "unloadModel":
        await unloadModel();
        result = undefined;
        break;

      default:
        throw new Error(`Unknown method: ${method}`);
    }

    self.postMessage({ type: "result", id, result });
  } catch (error) {
    self.postMessage({
      type: "error",
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Export types for the hook
export type { EmbeddingResult, ProgressCallback };
