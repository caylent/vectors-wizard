"use client";

import { cn } from "@/lib/utils";
import { useVisualizationStore, type IndexType } from "@/stores/visualizationStore";

const INDEX_TYPES: { id: IndexType; label: string; available: boolean }[] = [
  { id: "hnsw", label: "HNSW", available: true },
  { id: "ivf", label: "IVF", available: true },
  { id: "pq", label: "PQ", available: false },
  { id: "lsh", label: "LSH", available: false },
  { id: "flat", label: "Flat", available: false },
];

export function IndexTypeSelector() {
  const { indexType, setIndexType, reset } = useVisualizationStore();

  const handleChange = (type: IndexType) => {
    if (type !== indexType) {
      reset();
      setIndexType(type);
    }
  };

  return (
    <div className="glass flex gap-1 p-1">
      {INDEX_TYPES.map((type) => (
        <button
          key={type.id}
          onClick={() => type.available && handleChange(type.id)}
          disabled={!type.available}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            type.id === indexType
              ? "bg-primary text-primary-foreground shadow-lg"
              : type.available
              ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              : "text-muted-foreground/40 cursor-not-allowed"
          )}
        >
          {type.label}
          {!type.available && (
            <span className="ml-1 text-[0.5rem] opacity-50">soon</span>
          )}
        </button>
      ))}
    </div>
  );
}
