import { create } from "zustand";

export type IndexType = "hnsw" | "ivf" | "pq" | "lsh" | "flat";

export interface VisualizationState {
  // Current index type being visualized
  indexType: IndexType;
  setIndexType: (type: IndexType) => void;

  // Animation state
  isAnimating: boolean;
  setIsAnimating: (animating: boolean) => void;

  // Search state
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;

  // Camera auto-rotate
  autoRotate: boolean;
  setAutoRotate: (rotate: boolean) => void;

  // Node count for visualization (visual nodes, not actual vectors)
  visualNodeCount: number;
  setVisualNodeCount: (count: number) => void;

  // Selected node for inspection
  selectedNodeId: number | null;
  setSelectedNodeId: (id: number | null) => void;

  // Search path for highlighting
  searchPath: number[];
  setSearchPath: (path: number[]) => void;

  // Reset visualization state
  reset: () => void;
}

export const useVisualizationStore = create<VisualizationState>((set) => ({
  indexType: "hnsw",
  setIndexType: (type) => set({ indexType: type }),

  isAnimating: false,
  setIsAnimating: (animating) => set({ isAnimating: animating }),

  isSearching: false,
  setIsSearching: (searching) => set({ isSearching: searching }),

  autoRotate: true,
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),

  visualNodeCount: 45,
  setVisualNodeCount: (count) => set({ visualNodeCount: count }),

  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  searchPath: [],
  setSearchPath: (path) => set({ searchPath: path }),

  reset: () =>
    set({
      isAnimating: false,
      isSearching: false,
      selectedNodeId: null,
      searchPath: [],
    }),
}));
