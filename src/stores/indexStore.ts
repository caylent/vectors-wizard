import { create } from "zustand";

// HNSW-specific parameters
export interface HNSWParams {
  M: number; // Max connections per node
  efConstruction: number; // Construction-time beam width
  efSearch: number; // Search-time beam width
}

// IVF-specific parameters
export interface IVFParams {
  nlist: number; // Number of clusters
  nprobe: number; // Clusters to search
}

// PQ-specific parameters
export interface PQParams {
  M: number; // Number of subvectors
  nbits: number; // Bits per subvector code
}

// LSH-specific parameters
export interface LSHParams {
  numTables: number; // Number of hash tables
  numBits: number; // Hash bits per table
}

export interface IndexState {
  // Data parameters
  vectorCount: number; // Number of vectors (e.g., 100, 1000, 100000)
  dimensions: number; // Full embedding dimensions
  mrlDimensions: number; // Matryoshka truncated dimensions

  // HNSW parameters
  hnsw: HNSWParams;
  setHNSWParam: <K extends keyof HNSWParams>(key: K, value: HNSWParams[K]) => void;

  // IVF parameters
  ivf: IVFParams;
  setIVFParam: <K extends keyof IVFParams>(key: K, value: IVFParams[K]) => void;

  // PQ parameters
  pq: PQParams;
  setPQParam: <K extends keyof PQParams>(key: K, value: PQParams[K]) => void;

  // LSH parameters
  lsh: LSHParams;
  setLSHParam: <K extends keyof LSHParams>(key: K, value: LSHParams[K]) => void;

  // Common setters
  setVectorCount: (count: number) => void;
  setDimensions: (dims: number) => void;
  setMRLDimensions: (dims: number) => void;

  // Computed metrics (updated by metrics module)
  metrics: IndexMetrics;
  setMetrics: (metrics: IndexMetrics) => void;
}

export interface IndexMetrics {
  vectorStorageBytes: number;
  graphStorageBytes: number;
  totalStorageBytes: number;
  ramUsageBytes: number;
  buildTimeSeconds: number;
  queryLatencyMs: number;
  qps: number;
  recall: number;
  mrlQuality: number;
}

const defaultMetrics: IndexMetrics = {
  vectorStorageBytes: 0,
  graphStorageBytes: 0,
  totalStorageBytes: 0,
  ramUsageBytes: 0,
  buildTimeSeconds: 0,
  queryLatencyMs: 0,
  qps: 0,
  recall: 0,
  mrlQuality: 1,
};

export const DIMENSION_OPTIONS = [256, 512, 768, 1024, 1280, 1536, 1792, 2048, 2304, 2560, 2816, 3072];

export const useIndexStore = create<IndexState>((set) => ({
  // Defaults
  vectorCount: 100000,
  dimensions: 3072,
  mrlDimensions: 1536,

  hnsw: {
    M: 4,
    efConstruction: 100,
    efSearch: 20,
  },

  ivf: {
    nlist: 100,
    nprobe: 10,
  },

  pq: {
    M: 8,
    nbits: 8,
  },

  lsh: {
    numTables: 10,
    numBits: 12,
  },

  metrics: defaultMetrics,

  setHNSWParam: (key, value) =>
    set((state) => ({
      hnsw: { ...state.hnsw, [key]: value },
    })),

  setIVFParam: (key, value) =>
    set((state) => ({
      ivf: { ...state.ivf, [key]: value },
    })),

  setPQParam: (key, value) =>
    set((state) => ({
      pq: { ...state.pq, [key]: value },
    })),

  setLSHParam: (key, value) =>
    set((state) => ({
      lsh: { ...state.lsh, [key]: value },
    })),

  setVectorCount: (count) => set({ vectorCount: count }),
  setDimensions: (dims) => set({ dimensions: dims }),
  setMRLDimensions: (dims) => set({ mrlDimensions: dims }),
  setMetrics: (metrics) => set({ metrics }),
}));
