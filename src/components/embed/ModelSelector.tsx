"use client";

import { useEmbeddingStore, AVAILABLE_MODELS } from "@/stores/embeddingStore";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ModelSelector() {
  const { selectedModel, setSelectedModel, isModelLoading, modelLoadProgress } =
    useEmbeddingStore();

  return (
    <Card>
      <CardHeader>
        <Badge variant="blue">MODEL</Badge>
        <CardTitle>Embedding Model</CardTitle>
      </CardHeader>
      <CardDescription>
        Select a model for generating embeddings. Larger models have higher quality but slower
        inference.
      </CardDescription>
      <CardContent className="space-y-2">
        {AVAILABLE_MODELS.map((model) => (
          <button
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
            disabled={isModelLoading}
            className={cn(
              "w-full p-3 rounded-lg border text-left transition-all",
              selectedModel === model.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-sm">{model.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {model.dimensions}d · {model.size}
                </div>
              </div>
              {selectedModel === model.id && (
                <Badge variant="blue" className="text-[0.6rem]">
                  Selected
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground/70 mt-1.5">
              {model.description}
            </div>
          </button>
        ))}

        {isModelLoading && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Loading model...</span>
              <span className="text-primary">{Math.round(modelLoadProgress)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${modelLoadProgress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
