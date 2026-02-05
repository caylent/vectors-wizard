import type { ProviderPreset } from "../types";

export const WEAVIATE_PRESETS: ProviderPreset[] = [
  {
    name: "Starter",
    description: "100K objects, 1536-dim, single replica",
    config: {
      numObjects: 100_000,
      dimensions: 1536,
      replicationFactor: 1,
      storageGiB: 5,
      backupGiB: 2,
    },
  },
  {
    name: "Production",
    description: "1M objects, 1024-dim, 2x replication",
    config: {
      numObjects: 1_000_000,
      dimensions: 1024,
      replicationFactor: 2,
      storageGiB: 20,
      backupGiB: 10,
    },
  },
  {
    name: "High Availability",
    description: "5M objects, 1536-dim, 3x replication",
    config: {
      numObjects: 5_000_000,
      dimensions: 1536,
      replicationFactor: 3,
      storageGiB: 100,
      backupGiB: 50,
    },
  },
  {
    name: "Enterprise",
    description: "20M objects, 1024-dim, 3x replication",
    config: {
      numObjects: 20_000_000,
      dimensions: 1024,
      replicationFactor: 3,
      storageGiB: 300,
      backupGiB: 150,
    },
  },
];
