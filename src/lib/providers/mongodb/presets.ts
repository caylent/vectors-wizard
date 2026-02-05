import type { ProviderPreset } from "../types";

export const MONGODB_PRESETS: ProviderPreset[] = [
  {
    name: "Dev/Test (Flex)",
    description: "Flex tier for development",
    config: {
      clusterType: 0, // flex
      flexOpsPerSec: 100,
      dedicatedTier: 0, // M10
      storageGB: 5,
      replicaCount: 3,
    },
  },
  {
    name: "Small Production (M10)",
    description: "Entry dedicated tier, 2GB RAM",
    config: {
      clusterType: 1, // dedicated
      flexOpsPerSec: 100,
      dedicatedTier: 0, // M10
      storageGB: 20,
      replicaCount: 3,
    },
  },
  {
    name: "Medium Production (M30)",
    description: "8GB RAM, suitable for most workloads",
    config: {
      clusterType: 1, // dedicated
      flexOpsPerSec: 100,
      dedicatedTier: 2, // M30
      storageGB: 100,
      replicaCount: 3,
    },
  },
  {
    name: "Large Production (M50)",
    description: "32GB RAM, high-performance workloads",
    config: {
      clusterType: 1, // dedicated
      flexOpsPerSec: 100,
      dedicatedTier: 4, // M50
      storageGB: 500,
      replicaCount: 3,
    },
  },
];
