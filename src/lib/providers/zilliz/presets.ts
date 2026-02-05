import type { ProviderPreset } from "../types";

export const ZILLIZ_PRESETS: ProviderPreset[] = [
  {
    name: "Free Tier Demo",
    description: "Within free tier limits (5GB, 2.5M vCUs)",
    config: {
      numVectors: 100_000,
      dimensions: 768,
      metadataBytes: 100,
      monthlyQueries: 500_000,
      monthlyWrites: 50_000,
      includeFreeTier: 1,
    },
  },
  {
    name: "Startup",
    description: "100K vectors, moderate usage",
    config: {
      numVectors: 100_000,
      dimensions: 1536,
      metadataBytes: 200,
      monthlyQueries: 1_000_000,
      monthlyWrites: 100_000,
      includeFreeTier: 1,
    },
  },
  {
    name: "Growth",
    description: "1M vectors, high query volume",
    config: {
      numVectors: 1_000_000,
      dimensions: 1024,
      metadataBytes: 150,
      monthlyQueries: 5_000_000,
      monthlyWrites: 500_000,
      includeFreeTier: 0,
    },
  },
  {
    name: "Scale",
    description: "10M+ vectors, batch operations",
    config: {
      numVectors: 10_000_000,
      dimensions: 768,
      metadataBytes: 100,
      monthlyQueries: 10_000_000,
      monthlyWrites: 2_000_000,
      includeFreeTier: 0,
    },
  },
];
