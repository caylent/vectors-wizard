"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEmbeddingStore, AVAILABLE_MODELS } from "@/stores/embeddingStore";
import { useEmbeddingWorker } from "@/hooks/useEmbeddingWorker";
import { cn } from "@/lib/utils";
import Link from "next/link";

function ModelSelector() {
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

function TextInput() {
  const [text, setText] = useState("");
  const { isEmbedding, embeddingProgress, error } = useEmbeddingStore();
  const { isReady, generateEmbeddings } = useEmbeddingWorker();

  const handleEmbed = async () => {
    if (!text.trim()) return;
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    await generateEmbeddings(lines);
    setText("");
  };

  return (
    <Card>
      <CardHeader>
        <Badge variant="purple">INPUT</Badge>
        <CardTitle>Text to Embed</CardTitle>
      </CardHeader>
      <CardDescription>
        Enter text to generate embeddings. One item per line for batch processing.
      </CardDescription>
      <CardContent>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here...&#10;&#10;Each line becomes a separate embedding.&#10;&#10;Example:&#10;The quick brown fox&#10;A lazy dog sleeps&#10;Machine learning is fun"
          className="w-full h-40 p-3 bg-muted/30 border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-primary"
          disabled={isEmbedding}
        />

        <div className="flex gap-2 mt-3">
          <Button
            onClick={handleEmbed}
            disabled={!isReady || isEmbedding || !text.trim()}
            className="flex-1"
          >
            {isEmbedding ? `Embedding... ${Math.round(embeddingProgress)}%` : "Generate Embeddings"}
          </Button>
        </div>

        {error && (
          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive">
            {error}
          </div>
        )}

        {!isReady && (
          <div className="mt-3 text-xs text-muted-foreground">
            Initializing embedding worker...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmbeddingsList() {
  const { embeddings, removeEmbedding, clearEmbeddings } = useEmbeddingStore();

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
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {embeddings.map((emb) => (
            <div
              key={emb.id}
              className="p-2 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
            >
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
          ))}
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

export default function EmbedPage() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <Link href="/visualizer" className="inline-block">
            <h1
              className="text-2xl font-bold tracking-tight hover:text-primary transition-colors"
              style={{ textShadow: "0 0 20px rgba(77,166,255,0.3)" }}
            >
              Embedding Visualizer
            </h1>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and visualize text embeddings in real-time
          </p>
        </header>

        {/* Navigation */}
        <nav className="flex justify-center gap-2 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              Calculator
            </Button>
          </Link>
          <Link href="/visualizer">
            <Button variant="ghost" size="sm">
              HNSW
            </Button>
          </Link>
          <Link href="/visualizer/explore">
            <Button variant="ghost" size="sm">
              Explore
            </Button>
          </Link>
          <Link href="/visualizer/embed">
            <Button variant="outline" size="sm">
              Embed Text
            </Button>
          </Link>
          <Link href="/visualizer/compare">
            <Button variant="ghost" size="sm">
              Compare
            </Button>
          </Link>
        </nav>

        {/* Main content */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ModelSelector />
            <TextInput />
          </div>
          <div>
            <EmbeddingsList />
          </div>
        </div>
      </div>
    </main>
  );
}
