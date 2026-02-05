import type { ProviderPreset } from "../types";

export const TURBOPUFFER_PRESETS: ProviderPreset[] = [
  {
    name: "Starter",
    description: "100K vectors, moderate usage (Launch plan)",
    config: {
      numVectors: 100_000,
      dimensions: 1536,
      metadataBytes: 200,
      monthlyWriteGB: 5,
      monthlyQueryGB: 10,
      plan: 0, // launch
    },
  },
  {
    name: "Growing",
    description: "1M vectors, active workload",
    config: {
      numVectors: 1_000_000,
      dimensions: 1024,
      metadataBytes: 150,
      monthlyWriteGB: 20,
      monthlyQueryGB: 50,
      plan: 0, // launch
    },
  },
  {
    name: "Scale",
    description: "10M vectors, high throughput (Scale plan)",
    config: {
      numVectors: 10_000_000,
      dimensions: 768,
      metadataBytes: 100,
      monthlyWriteGB: 100,
      monthlyQueryGB: 500,
      plan: 1, // scale
    },
  },
  {
    name: "Enterprise",
    description: "100M vectors, mission-critical",
    config: {
      numVectors: 100_000_000,
      dimensions: 768,
      metadataBytes: 100,
      monthlyWriteGB: 500,
      monthlyQueryGB: 2000,
      plan: 2, // enterprise
    },
  },
];
