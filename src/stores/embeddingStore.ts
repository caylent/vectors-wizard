import { create } from "zustand";

export type ModelId =
  | "Xenova/all-MiniLM-L6-v2"
  | "Xenova/bge-small-en-v1.5"
  | "Xenova/nomic-embed-text-v1";

export interface ModelInfo {
  id: ModelId;
  name: string;
  dimensions: number;
  size: string;
  description: string;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: "Xenova/all-MiniLM-L6-v2",
    name: "MiniLM-L6",
    dimensions: 384,
    size: "~23MB",
    description: "Fast, lightweight general-purpose model",
  },
  {
    id: "Xenova/bge-small-en-v1.5",
    name: "BGE Small",
    dimensions: 384,
    size: "~33MB",
    description: "High-quality retrieval-focused model",
  },
  {
    id: "Xenova/nomic-embed-text-v1",
    name: "Nomic Embed",
    dimensions: 768,
    size: "~130MB",
    description: "Larger model with dimension truncation support",
  },
];

export interface EmbeddingVector {
  id: string;
  text: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

export interface EmbeddingState {
  // Model state
  selectedModel: ModelId;
  setSelectedModel: (model: ModelId) => void;

  isModelLoading: boolean;
  setIsModelLoading: (loading: boolean) => void;

  modelLoadProgress: number;
  setModelLoadProgress: (progress: number) => void;

  // Embedding generation state
  isEmbedding: boolean;
  setIsEmbedding: (embedding: boolean) => void;

  embeddingProgress: number;
  setEmbeddingProgress: (progress: number) => void;

  // Stored embeddings
  embeddings: EmbeddingVector[];
  addEmbedding: (embedding: EmbeddingVector) => void;
  addEmbeddings: (embeddings: EmbeddingVector[]) => void;
  removeEmbedding: (id: string) => void;
  clearEmbeddings: () => void;

  // Text input buffer
  inputTexts: string[];
  setInputTexts: (texts: string[]) => void;
  addInputText: (text: string) => void;
  clearInputTexts: () => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;
}

export const useEmbeddingStore = create<EmbeddingState>((set) => ({
  selectedModel: "Xenova/all-MiniLM-L6-v2",
  setSelectedModel: (model) => set({ selectedModel: model }),

  isModelLoading: false,
  setIsModelLoading: (loading) => set({ isModelLoading: loading }),

  modelLoadProgress: 0,
  setModelLoadProgress: (progress) => set({ modelLoadProgress: progress }),

  isEmbedding: false,
  setIsEmbedding: (embedding) => set({ isEmbedding: embedding }),

  embeddingProgress: 0,
  setEmbeddingProgress: (progress) => set({ embeddingProgress: progress }),

  embeddings: [],
  addEmbedding: (embedding) =>
    set((state) => ({
      embeddings: [...state.embeddings, embedding],
    })),
  addEmbeddings: (embeddings) =>
    set((state) => ({
      embeddings: [...state.embeddings, ...embeddings],
    })),
  removeEmbedding: (id) =>
    set((state) => ({
      embeddings: state.embeddings.filter((e) => e.id !== id),
    })),
  clearEmbeddings: () => set({ embeddings: [] }),

  inputTexts: [],
  setInputTexts: (texts) => set({ inputTexts: texts }),
  addInputText: (text) =>
    set((state) => ({
      inputTexts: [...state.inputTexts, text],
    })),
  clearInputTexts: () => set({ inputTexts: [] }),

  error: null,
  setError: (error) => set({ error }),
}));
