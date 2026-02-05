import type { ProviderPreset } from "../types";

export const OPENSEARCH_PRESETS: ProviderPreset[] = [
  {
    name: "Dev/Test",
    description: "Small index, minimal OCUs for development",
    config: {
      indexSizeGB: 10,
      deploymentMode: 0, // 0 = dev-test
      monthlyQueries: 100_000,
      monthlyWrites: 50_000,
      maxSearchOCUs: 1,
      maxIndexingOCUs: 1,
    },
  },
  {
    name: "Production Small",
    description: "10GB index, 2 OCUs for light production",
    config: {
      indexSizeGB: 10,
      deploymentMode: 1, // 1 = production
      monthlyQueries: 1_000_000,
      monthlyWrites: 100_000,
      maxSearchOCUs: 2,
      maxIndexingOCUs: 2,
    },
  },
  {
    name: "Production Medium",
    description: "100GB index, 4 OCUs for moderate workloads",
    config: {
      indexSizeGB: 100,
      deploymentMode: 1,
      monthlyQueries: 5_000_000,
      monthlyWrites: 500_000,
      maxSearchOCUs: 4,
      maxIndexingOCUs: 4,
    },
  },
  {
    name: "Production Large",
    description: "1TB index, 8+ OCUs for high-volume workloads",
    config: {
      indexSizeGB: 1000,
      deploymentMode: 1,
      monthlyQueries: 20_000_000,
      monthlyWrites: 2_000_000,
      maxSearchOCUs: 10,
      maxIndexingOCUs: 10,
    },
  },
];
