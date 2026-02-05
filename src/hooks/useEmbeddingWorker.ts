"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEmbeddingStore, type ModelId } from "@/stores/embeddingStore";

// Progress callback types
interface LoadProgress {
  progress?: number;
  status?: string;
}

interface EmbedProgress {
  current?: number;
  total?: number;
}

// Simplified worker wrapper without comlink for compatibility
class WorkerWrapper {
  private worker: Worker;
  private callbacks: Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }> = new Map();
  private callId = 0;
  private progressCallbacks: Map<number, (progress: unknown) => void> = new Map();

  constructor(worker: Worker) {
    this.worker = worker;
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type, id, result, error, progress, current, total } = event.data;

    if (type === "progress" && id !== undefined) {
      const callback = this.progressCallbacks.get(id);
      callback?.(progress || { current, total });
      return;
    }

    const pending = this.callbacks.get(id);
    if (!pending) return;

    this.callbacks.delete(id);
    this.progressCallbacks.delete(id);

    if (type === "error") {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  }

  call(method: string, args: unknown[], onProgress?: (progress: unknown) => void): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.callId;
      this.callbacks.set(id, { resolve, reject });
      if (onProgress) {
        this.progressCallbacks.set(id, onProgress);
      }
      this.worker.postMessage({ id, method, args });
    });
  }

  terminate() {
    this.worker.terminate();
    this.callbacks.clear();
    this.progressCallbacks.clear();
  }
}

export function useEmbeddingWorker() {
  const workerRef = useRef<WorkerWrapper | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);

  const {
    selectedModel,
    setIsModelLoading,
    setModelLoadProgress,
    setIsEmbedding,
    setEmbeddingProgress,
    addEmbeddings,
    setError,
  } = useEmbeddingStore();

  // Initialize worker
  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;

    async function initWorker() {
      try {
        // Create worker from public directory to avoid bundling issues
        const worker = new Worker("/workers/embedding.worker.js", {
          type: "module",
        });

        if (!mounted) {
          worker.terminate();
          return;
        }

        workerRef.current = new WorkerWrapper(worker);
        setIsReady(true);
        setWorkerError(null);
      } catch (error) {
        console.error("Failed to initialize embedding worker:", error);
        setWorkerError(error instanceof Error ? error.message : "Failed to initialize worker");
        setError("Embedding worker not available. This feature requires browser support for Web Workers.");
      }
    }

    initWorker();

    return () => {
      mounted = false;
      workerRef.current?.terminate();
      workerRef.current = null;
      setIsReady(false);
    };
  }, [setError]);

  // Load model
  const loadModel = useCallback(
    async (modelId: ModelId) => {
      if (!workerRef.current) {
        setError("Worker not initialized");
        return false;
      }

      try {
        setIsModelLoading(true);
        setModelLoadProgress(0);
        setError(null);

        await workerRef.current.call("loadModel", [modelId], (p) => {
          const progress = p as LoadProgress;
          if (progress?.progress !== undefined) {
            setModelLoadProgress(progress.progress);
          }
        });

        setModelLoadProgress(100);
        return true;
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load model");
        return false;
      } finally {
        setIsModelLoading(false);
      }
    },
    [setIsModelLoading, setModelLoadProgress, setError]
  );

  // Generate embeddings
  const generateEmbeddings = useCallback(
    async (texts: string[]) => {
      if (!workerRef.current) {
        setError("Worker not initialized");
        return null;
      }

      // Ensure model is loaded
      const modelInfo = await workerRef.current.call("getModelInfo", []) as { modelId: string | null; isLoaded: boolean };
      if (!modelInfo.isLoaded || modelInfo.modelId !== selectedModel) {
        const loaded = await loadModel(selectedModel);
        if (!loaded) return null;
      }

      try {
        setIsEmbedding(true);
        setEmbeddingProgress(0);
        setError(null);

        // Create items with IDs
        const items = texts.map((text, idx) => ({
          id: `emb-${Date.now()}-${idx}`,
          text,
        }));

        const results = await workerRef.current.call(
          "embedWithIds",
          [items, { batchSize: 16 }],
          (p) => {
            const progress = p as EmbedProgress;
            if (progress?.current !== undefined && progress?.total !== undefined) {
              setEmbeddingProgress((progress.current / progress.total) * 100);
            }
          }
        ) as Array<{ id: string; text: string; vector: number[] }>;

        // Add to store
        addEmbeddings(results);
        setEmbeddingProgress(100);

        return results;
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to generate embeddings");
        return null;
      } finally {
        setIsEmbedding(false);
      }
    },
    [selectedModel, loadModel, setIsEmbedding, setEmbeddingProgress, setError, addEmbeddings]
  );

  // Embed single text
  const embedText = useCallback(
    async (text: string) => {
      const results = await generateEmbeddings([text]);
      return results?.[0] ?? null;
    },
    [generateEmbeddings]
  );

  return {
    isReady,
    workerError,
    loadModel,
    generateEmbeddings,
    embedText,
  };
}
