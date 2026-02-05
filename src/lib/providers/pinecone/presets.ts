import type { ProviderPreset } from "../types";

export const PINECONE_PRESETS: ProviderPreset[] = [
  {
    name: "RAG Chatbot",
    description: "100K document chunks, 1536-dim, moderate query load",
    config: {
      numVectors: 100_000,
      dimensions: 1536,
      metadataBytes: 200,
      monthlyQueries: 500_000,
      monthlyUpserts: 10_000,
      embeddingCostPerMTokens: 0.02,
      avgTokensPerVector: 256,
      avgTokensPerQuery: 25,
    },
  },
  {
    name: "Semantic Search",
    description: "1M vectors, 1024-dim, high query volume",
    config: {
      numVectors: 1_000_000,
      dimensions: 1024,
      metadataBytes: 150,
      monthlyQueries: 5_000_000,
      monthlyUpserts: 50_000,
      embeddingCostPerMTokens: 0.02,
      avgTokensPerVector: 100,
      avgTokensPerQuery: 20,
    },
  },
  {
    name: "Recommendation Engine",
    description: "10M items, 768-dim, batch writes",
    config: {
      numVectors: 10_000_000,
      dimensions: 768,
      metadataBytes: 100,
      monthlyQueries: 2_000_000,
      monthlyUpserts: 1_000_000,
      embeddingCostPerMTokens: 0,
      avgTokensPerVector: 0,
      avgTokensPerQuery: 0,
    },
  },
  {
    name: "Development",
    description: "10K vectors, minimal usage for testing",
    config: {
      numVectors: 10_000,
      dimensions: 1536,
      metadataBytes: 200,
      monthlyQueries: 10_000,
      monthlyUpserts: 1_000,
      embeddingCostPerMTokens: 0.02,
      avgTokensPerVector: 256,
      avgTokensPerQuery: 25,
    },
  },
];
