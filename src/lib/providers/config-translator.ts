// Translates a "universal" config to provider-specific configs
// This allows comparing costs across providers with different pricing models

import { getProvider, listProviders } from "./registry";

export interface UniversalConfig {
  // Core vector config
  numVectors: number;
  dimensions: number;
  metadataBytes: number;

  // Usage patterns
  monthlyQueries: number;
  monthlyWrites: number;

  // Embeddings (optional)
  embeddingCostPerMTokens: number;
  avgTokensPerVector: number;
  avgTokensPerQuery: number;
}

// Extract universal config from any provider's config
export function extractUniversalConfig(providerId: string, config: Record<string, number>): UniversalConfig {
  const base: UniversalConfig = {
    numVectors: 100_000,
    dimensions: 1536,
    metadataBytes: 200,
    monthlyQueries: 500_000,
    monthlyWrites: 50_000,
    embeddingCostPerMTokens: 0,
    avgTokensPerVector: 256,
    avgTokensPerQuery: 25,
  };

  // Map provider-specific fields to universal
  switch (providerId) {
    case "s3-vectors":
      return {
        ...base,
        numVectors: config.numVectors ?? base.numVectors,
        dimensions: config.dimensions ?? base.dimensions,
        metadataBytes: (config.filterableMetadataBytes ?? 0) + (config.nonFilterableMetadataBytes ?? 0),
        monthlyQueries: config.monthlyQueries ?? base.monthlyQueries,
        monthlyWrites: config.monthlyVectorsWritten ?? base.monthlyWrites,
        embeddingCostPerMTokens: config.embeddingCostPerMTokens ?? 0,
        avgTokensPerVector: config.avgTokensPerVector ?? base.avgTokensPerVector,
        avgTokensPerQuery: config.avgTokensPerQuery ?? base.avgTokensPerQuery,
      };

    case "pinecone":
      return {
        ...base,
        numVectors: config.numVectors ?? base.numVectors,
        dimensions: config.dimensions ?? base.dimensions,
        metadataBytes: config.metadataBytes ?? base.metadataBytes,
        monthlyQueries: config.monthlyQueries ?? base.monthlyQueries,
        monthlyWrites: config.monthlyUpserts ?? base.monthlyWrites,
        embeddingCostPerMTokens: config.embeddingCostPerMTokens ?? 0,
        avgTokensPerVector: config.avgTokensPerVector ?? base.avgTokensPerVector,
        avgTokensPerQuery: config.avgTokensPerQuery ?? base.avgTokensPerQuery,
      };

    case "zilliz":
      return {
        ...base,
        numVectors: config.numVectors ?? base.numVectors,
        dimensions: config.dimensions ?? base.dimensions,
        metadataBytes: config.metadataBytes ?? base.metadataBytes,
        monthlyQueries: config.monthlyQueries ?? base.monthlyQueries,
        monthlyWrites: config.monthlyWrites ?? base.monthlyWrites,
      };

    case "weaviate":
      return {
        ...base,
        numVectors: config.numObjects ?? base.numVectors,
        dimensions: config.dimensions ?? base.dimensions,
        metadataBytes: base.metadataBytes,
        monthlyQueries: base.monthlyQueries,
        monthlyWrites: base.monthlyWrites,
      };

    case "opensearch":
      // Estimate vectors from index size
      const avgVectorSize = (base.dimensions * 4 + base.metadataBytes) * 1.5; // with index overhead
      return {
        ...base,
        numVectors: Math.round((config.indexSizeGB ?? 10) * 1024 * 1024 * 1024 / avgVectorSize),
        dimensions: base.dimensions,
        metadataBytes: base.metadataBytes,
        monthlyQueries: config.monthlyQueries ?? base.monthlyQueries,
        monthlyWrites: config.monthlyWrites ?? base.monthlyWrites,
      };

    case "mongodb":
    case "mongodb-selfhosted":
    case "milvus":
      // Infrastructure-based - use defaults
      return base;

    case "turbopuffer":
      return {
        ...base,
        numVectors: config.numVectors ?? base.numVectors,
        dimensions: config.dimensions ?? base.dimensions,
        metadataBytes: config.metadataBytes ?? base.metadataBytes,
        monthlyQueries: base.monthlyQueries,
        monthlyWrites: base.monthlyWrites,
      };

    default:
      return base;
  }
}

// Translate universal config to a specific provider's config
export function translateToProvider(
  targetProviderId: string,
  universal: UniversalConfig
): Record<string, number> {
  switch (targetProviderId) {
    case "s3-vectors":
      return {
        numVectors: universal.numVectors,
        dimensions: universal.dimensions,
        avgKeyLengthBytes: 30,
        filterableMetadataBytes: Math.round(universal.metadataBytes * 0.4),
        nonFilterableMetadataBytes: Math.round(universal.metadataBytes * 0.6),
        monthlyQueries: universal.monthlyQueries,
        monthlyVectorsWritten: universal.monthlyWrites,
        embeddingCostPerMTokens: universal.embeddingCostPerMTokens,
        avgTokensPerVector: universal.avgTokensPerVector,
        avgTokensPerQuery: universal.avgTokensPerQuery,
      };

    case "pinecone":
      return {
        numVectors: universal.numVectors,
        dimensions: universal.dimensions,
        metadataBytes: universal.metadataBytes,
        monthlyQueries: universal.monthlyQueries,
        monthlyUpserts: universal.monthlyWrites,
        embeddingCostPerMTokens: universal.embeddingCostPerMTokens,
        avgTokensPerVector: universal.avgTokensPerVector,
        avgTokensPerQuery: universal.avgTokensPerQuery,
      };

    case "opensearch": {
      // Estimate index size from vectors
      const avgVectorSize = (universal.dimensions * 4 + universal.metadataBytes) * 1.5;
      const indexSizeGB = (universal.numVectors * avgVectorSize) / (1024 ** 3);
      return {
        indexSizeGB: Math.max(1, Math.ceil(indexSizeGB)),
        deploymentMode: 1, // production
        monthlyQueries: universal.monthlyQueries,
        monthlyWrites: universal.monthlyWrites,
        maxSearchOCUs: Math.max(2, Math.ceil(universal.monthlyQueries / 50_000_000)),
        maxIndexingOCUs: Math.max(2, Math.ceil(universal.monthlyWrites / 10_000_000)),
      };
    }

    case "zilliz":
      return {
        numVectors: universal.numVectors,
        dimensions: universal.dimensions,
        metadataBytes: universal.metadataBytes,
        monthlyQueries: universal.monthlyQueries,
        monthlyWrites: universal.monthlyWrites,
        includeFreeTier: 0, // Show full costs for comparison
      };

    case "weaviate": {
      // Estimate storage from vectors
      const vectorBytes = universal.numVectors * universal.dimensions * 4;
      const metadataTotal = universal.numVectors * universal.metadataBytes;
      const storageGiB = Math.ceil((vectorBytes + metadataTotal) * 1.5 / (1024 ** 3));
      return {
        numObjects: universal.numVectors,
        dimensions: universal.dimensions,
        replicationFactor: 1,
        storageGiB: Math.max(1, storageGiB),
        backupGiB: Math.max(1, Math.ceil(storageGiB * 0.5)),
      };
    }

    case "turbopuffer": {
      // Estimate data volumes
      const vectorBytes = universal.dimensions * 4 + universal.metadataBytes;
      const monthlyWriteGB = (universal.monthlyWrites * vectorBytes) / (1024 ** 3);
      const monthlyQueryGB = (universal.monthlyQueries * universal.numVectors * 0.01 * vectorBytes) / (1024 ** 3); // ~1% scanned per query
      return {
        numVectors: universal.numVectors,
        dimensions: universal.dimensions,
        metadataBytes: universal.metadataBytes,
        monthlyWriteGB: Math.max(1, Math.ceil(monthlyWriteGB)),
        monthlyQueryGB: Math.max(1, Math.ceil(monthlyQueryGB)),
        plan: 0, // launch
      };
    }

    case "mongodb": {
      // Estimate required tier based on vector count
      // M10: ~100K vectors, M30: ~1M, M50: ~5M
      let tier = 0; // M10
      if (universal.numVectors > 5_000_000) tier = 4; // M50
      else if (universal.numVectors > 1_000_000) tier = 2; // M30
      else if (universal.numVectors > 500_000) tier = 1; // M20
      return {
        clusterType: 1, // dedicated
        flexOpsPerSec: 100,
        dedicatedTier: tier,
        storageGB: Math.max(20, Math.ceil((universal.numVectors * (universal.dimensions * 4 + universal.metadataBytes)) / (1024 ** 3))),
        replicaCount: 3,
      };
    }

    case "mongodb-selfhosted": {
      // Estimate instance type based on memory needs
      const memoryNeededGB = (universal.numVectors * universal.dimensions * 4) / (1024 ** 3) * 2;
      let instanceType = 0; // t3.medium
      if (memoryNeededGB > 32) instanceType = 6; // r5.2xlarge
      else if (memoryNeededGB > 16) instanceType = 5; // r5.xlarge
      else if (memoryNeededGB > 8) instanceType = 3; // m5.xlarge
      else if (memoryNeededGB > 4) instanceType = 2; // m5.large
      return {
        instanceType,
        replicaCount: 3,
        storageGB: Math.max(50, Math.ceil((universal.numVectors * (universal.dimensions * 4 + universal.metadataBytes) * 1.5) / (1024 ** 3))),
        storageType: 0, // gp3
        dataTransferGB: Math.ceil(universal.monthlyQueries * 0.001), // ~1KB per query response
        includeConfigServers: 0,
        mongosCount: 0,
      };
    }

    case "milvus": {
      // Similar to MongoDB self-hosted
      const memoryNeededGB = (universal.numVectors * universal.dimensions * 4) / (1024 ** 3) * 2;
      let instanceType = 0; // t3.medium
      if (memoryNeededGB > 32) instanceType = 6; // r5.2xlarge
      else if (memoryNeededGB > 16) instanceType = 5; // r5.xlarge
      else if (memoryNeededGB > 8) instanceType = 3; // m5.xlarge
      else if (memoryNeededGB > 4) instanceType = 2; // m5.large
      return {
        instanceType,
        instanceCount: 1,
        storageGB: Math.max(50, Math.ceil((universal.numVectors * (universal.dimensions * 4 + universal.metadataBytes) * 1.5) / (1024 ** 3))),
        storageType: 0, // gp3
        dataTransferGB: Math.ceil(universal.monthlyQueries * 0.001),
        includeEtcd: 1,
        includeMinio: 0,
      };
    }

    default:
      return {};
  }
}

// Calculate costs for all providers based on a universal config
export interface ProviderComparison {
  providerId: string;
  name: string;
  description: string;
  monthlyCost: number;
  translatedConfig: Record<string, number>;
  isApplicable: boolean;
  notes?: string;
}

export function compareAllProviders(universal: UniversalConfig): ProviderComparison[] {
  const providers = listProviders();
  const results: ProviderComparison[] = [];

  for (const { id, name, description } of providers) {
    const provider = getProvider(id);
    if (!provider) continue;

    try {
      const translatedConfig = translateToProvider(id, universal);
      const costs = provider.calculateCosts(translatedConfig as never);

      results.push({
        providerId: id,
        name,
        description,
        monthlyCost: costs.totalMonthlyCost,
        translatedConfig,
        isApplicable: true,
      });
    } catch {
      results.push({
        providerId: id,
        name,
        description,
        monthlyCost: 0,
        translatedConfig: {},
        isApplicable: false,
        notes: "Unable to estimate for this configuration",
      });
    }
  }

  // Sort by cost (cheapest first)
  return results.sort((a, b) => {
    if (!a.isApplicable) return 1;
    if (!b.isApplicable) return -1;
    return a.monthlyCost - b.monthlyCost;
  });
}
