"use client";

import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/embed/ModelSelector";
import { TextInput } from "@/components/embed/TextInput";
import { EmbeddingsList } from "@/components/embed/EmbeddingsList";
import Link from "next/link";

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
