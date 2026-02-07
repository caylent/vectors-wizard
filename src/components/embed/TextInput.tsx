"use client";

import { useState } from "react";
import { useEmbeddingStore } from "@/stores/embeddingStore";
import { useEmbeddingWorker } from "@/hooks/useEmbeddingWorker";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TextInput() {
  const [text, setText] = useState("");
  const store = useEmbeddingStore();
  const { isEmbedding, embeddingProgress, error } = store;
  const { isReady, generateEmbeddings } = useEmbeddingWorker(store);

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
