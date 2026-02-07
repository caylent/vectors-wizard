"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEmbeddingStore } from "@/stores/embeddingStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EmbeddingsList() {
  const { embeddings, removeEmbedding, clearEmbeddings } = useEmbeddingStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: embeddings.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 60, // ~60px per item
    overscan: 5,
  });

  if (embeddings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Badge variant="orange">EMBEDDINGS</Badge>
          <CardTitle>Generated Vectors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            No embeddings yet. Enter some text above to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="orange">EMBEDDINGS</Badge>
          <CardTitle>Generated Vectors ({embeddings.length})</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={clearEmbeddings}>
          Clear All
        </Button>
      </CardHeader>
      <CardContent>
        <div ref={scrollRef} className="max-h-[400px] overflow-y-auto">
          <div
            style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const emb = embeddings[virtualItem.index];
              return (
                <div
                  key={emb.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="pb-2"
                >
                  <div className="p-2 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{emb.text}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {emb.vector.length}d · [{emb.vector.slice(0, 3).map((v) => v.toFixed(3)).join(", ")}...]
                        </div>
                      </div>
                      <button
                        onClick={() => removeEmbedding(emb.id)}
                        className="text-muted-foreground hover:text-destructive text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link href="/visualizer/explore" className="flex-1">
            <Button variant="outline" className="w-full">
              Visualize in 3D →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
