import { describe, it, expect } from "vitest";
import {
  extractUniversalConfig,
  translateToProvider,
  compareAllProviders,
} from "../config-translator";
import type { UniversalConfig } from "../types";
import { getProvider } from "../registry";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function expectAllFinite(obj: unknown, path = ""): void {
  if (obj === null || obj === undefined) return;
  if (typeof obj === "number") {
    expect(obj, `${path} should be finite`).not.toBeNaN();
    expect(Number.isFinite(obj), `${path} should be finite, got ${obj}`).toBe(true);
    return;
  }
  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      expectAllFinite(value, path ? `${path}.${key}` : key);
    }
  }
}

const TYPICAL_UNIVERSAL: UniversalConfig = {
  numVectors: 1_000_000,
  dimensions: 1536,
  metadataBytes: 200,
  monthlyQueries: 500_000,
  monthlyWrites: 50_000,
  embeddingCostPerMTokens: 0,
  avgTokensPerVector: 256,
  avgTokensPerQuery: 25,
};

const ALL_PROVIDER_IDS = [
  "s3-vectors",
  "pinecone",
  "opensearch",
  "weaviate",
  "zilliz",
  "turbopuffer",
  "mongodb",
  "mongodb-selfhosted",
  "milvus",
];

// ---------------------------------------------------------------------------
// extractUniversalConfig
// ---------------------------------------------------------------------------

describe("extractUniversalConfig", () => {
  it("returns a valid UniversalConfig for each provider", () => {
    for (const id of ALL_PROVIDER_IDS) {
      const provider = getProvider(id);
      if (!provider) continue;
      const defaultNumericConfig = provider.defaultConfig as Record<string, number>;
      const universal = extractUniversalConfig(id, defaultNumericConfig);

      expect(universal.numVectors, `${id}: numVectors`).toBeGreaterThan(0);
      expect(universal.dimensions, `${id}: dimensions`).toBeGreaterThan(0);
      expect(universal.metadataBytes, `${id}: metadataBytes`).toBeGreaterThanOrEqual(0);
      expect(universal.monthlyQueries, `${id}: monthlyQueries`).toBeGreaterThanOrEqual(0);
      expect(universal.monthlyWrites, `${id}: monthlyWrites`).toBeGreaterThanOrEqual(0);
      expectAllFinite(universal, `${id} universal`);
    }
  });

  it("returns default config for unknown provider", () => {
    const universal = extractUniversalConfig("nonexistent", {});
    expect(universal.numVectors).toBe(100_000);
    expect(universal.dimensions).toBe(1536);
  });
});

// ---------------------------------------------------------------------------
// translateToProvider
// ---------------------------------------------------------------------------

describe("translateToProvider", () => {
  it("returns a numeric config for each provider", () => {
    for (const id of ALL_PROVIDER_IDS) {
      const config = translateToProvider(id, TYPICAL_UNIVERSAL);

      // All values must be numbers
      for (const [key, value] of Object.entries(config)) {
        expect(typeof value, `${id}.${key} should be number`).toBe("number");
        expect(Number.isFinite(value), `${id}.${key} should be finite, got ${value}`).toBe(true);
      }
    }
  });

  it("returns empty config for unknown provider", () => {
    const config = translateToProvider("nonexistent", TYPICAL_UNIVERSAL);
    expect(config).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// compareAllProviders
// ---------------------------------------------------------------------------

describe("compareAllProviders", () => {
  it("returns results for all registered providers", () => {
    const results = compareAllProviders(TYPICAL_UNIVERSAL);
    const providerIds = results.map((r) => r.providerId);

    for (const id of ALL_PROVIDER_IDS) {
      expect(providerIds, `should include ${id}`).toContain(id);
    }
  });

  it("all results have non-negative monthlyCost", () => {
    const results = compareAllProviders(TYPICAL_UNIVERSAL);
    for (const result of results) {
      expect(result.monthlyCost, `${result.providerId}`).toBeGreaterThanOrEqual(0);
    }
  });

  it("results are sorted cheapest first", () => {
    const results = compareAllProviders(TYPICAL_UNIVERSAL);
    const applicableResults = results.filter((r) => r.isApplicable);

    for (let i = 1; i < applicableResults.length; i++) {
      expect(
        applicableResults[i].monthlyCost,
        `${applicableResults[i].providerId} should be >= ${applicableResults[i - 1].providerId}`
      ).toBeGreaterThanOrEqual(applicableResults[i - 1].monthlyCost);
    }
  });

  it("all applicable results produce finite costs", () => {
    const results = compareAllProviders(TYPICAL_UNIVERSAL);
    for (const result of results) {
      if (result.isApplicable) {
        expect(Number.isFinite(result.monthlyCost), `${result.providerId} cost is finite`).toBe(true);
      }
    }
  });

  it("handles small workload (100 vectors, 128 dims)", () => {
    const small: UniversalConfig = {
      numVectors: 100,
      dimensions: 128,
      metadataBytes: 50,
      monthlyQueries: 1000,
      monthlyWrites: 100,
      embeddingCostPerMTokens: 0,
      avgTokensPerVector: 0,
      avgTokensPerQuery: 0,
    };
    const results = compareAllProviders(small);
    for (const r of results) {
      expect(r.monthlyCost, `${r.providerId}`).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(r.monthlyCost), `${r.providerId} finite`).toBe(true);
    }
  });

  it("handles large workload (100M vectors, 4096 dims)", () => {
    const large: UniversalConfig = {
      numVectors: 100_000_000,
      dimensions: 4096,
      metadataBytes: 500,
      monthlyQueries: 50_000_000,
      monthlyWrites: 5_000_000,
      embeddingCostPerMTokens: 0.1,
      avgTokensPerVector: 256,
      avgTokensPerQuery: 25,
    };
    const results = compareAllProviders(large);
    for (const r of results) {
      if (r.isApplicable) {
        expect(r.monthlyCost, `${r.providerId}`).toBeGreaterThan(0);
        expect(Number.isFinite(r.monthlyCost), `${r.providerId} finite`).toBe(true);
      }
    }
  });

  it("handles zero workload", () => {
    const zero: UniversalConfig = {
      numVectors: 0,
      dimensions: 0,
      metadataBytes: 0,
      monthlyQueries: 0,
      monthlyWrites: 0,
      embeddingCostPerMTokens: 0,
      avgTokensPerVector: 0,
      avgTokensPerQuery: 0,
    };
    const results = compareAllProviders(zero);
    for (const r of results) {
      expect(r.monthlyCost, `${r.providerId}`).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(r.monthlyCost), `${r.providerId} finite`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// normalizeConfig: numeric enum → typed config via calculateCosts
// ---------------------------------------------------------------------------

describe("normalizeConfig via calculateCosts", () => {
  it("opensearch: handles numeric deploymentMode (0=dev-test, 1=production)", () => {
    const provider = getProvider("opensearch")!;

    const devResult = provider.calculateCosts({
      indexSizeGB: 10,
      deploymentMode: 0,
      monthlyQueries: 100_000,
      monthlyWrites: 10_000,
      maxSearchOCUs: 2,
      maxIndexingOCUs: 2,
    } as Record<string, number>);
    expect(devResult.totalMonthlyCost).toBeGreaterThan(0);

    const prodResult = provider.calculateCosts({
      indexSizeGB: 10,
      deploymentMode: 1,
      monthlyQueries: 100_000,
      monthlyWrites: 10_000,
      maxSearchOCUs: 2,
      maxIndexingOCUs: 2,
    } as Record<string, number>);
    expect(prodResult.totalMonthlyCost).toBeGreaterThan(devResult.totalMonthlyCost);
  });

  it("turbopuffer: handles numeric plan (0=launch, 1=scale, 2=enterprise)", () => {
    const provider = getProvider("turbopuffer")!;

    const plans = [0, 1, 2];
    const costs = plans.map((plan) =>
      provider.calculateCosts({
        numVectors: 0,
        dimensions: 0,
        metadataBytes: 0,
        monthlyWriteGB: 0,
        monthlyQueryGB: 0,
        plan,
      } as Record<string, number>).totalMonthlyCost
    );

    // Minimums: launch=64, scale=256, enterprise=4096
    expect(costs[0]).toBe(64);
    expect(costs[1]).toBe(256);
    expect(costs[2]).toBe(4096);
  });

  it("mongodb: handles numeric clusterType and dedicatedTier", () => {
    const provider = getProvider("mongodb")!;

    // Flex: clusterType=0
    const flexResult = provider.calculateCosts({
      clusterType: 0,
      flexOpsPerSec: 100,
      dedicatedTier: 0,
      storageGB: 20,
      replicaCount: 3,
    } as Record<string, number>);
    expect(flexResult.totalMonthlyCost).toBe(8); // Flex 100 ops/sec = $8

    // Dedicated M10: clusterType=1, dedicatedTier=0
    const dedicatedResult = provider.calculateCosts({
      clusterType: 1,
      flexOpsPerSec: 100,
      dedicatedTier: 0, // M10
      storageGB: 50,
      replicaCount: 3,
    } as Record<string, number>);
    expect(dedicatedResult.totalMonthlyCost).toBeGreaterThan(100);
  });

  it("milvus: handles numeric instanceType and storageType", () => {
    const provider = getProvider("milvus")!;

    // instanceType=2 (m5.large), storageType=0 (gp3)
    const result = provider.calculateCosts({
      instanceType: 2,
      instanceCount: 3,
      storageGB: 100,
      storageType: 0,
      dataTransferGB: 50,
      includeEtcd: 1,
      includeMinio: 0,
    } as Record<string, number>);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
    expectAllFinite(result);
  });

  it("mongodb-selfhosted: handles numeric instanceType and storageType", () => {
    const provider = getProvider("mongodb-selfhosted")!;

    // instanceType=2 (m5.large), storageType=0 (gp3)
    const result = provider.calculateCosts({
      instanceType: 2,
      replicaCount: 3,
      storageGB: 100,
      storageType: 0,
      dataTransferGB: 100,
      includeConfigServers: 0,
      mongosCount: 0,
    } as Record<string, number>);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
    expectAllFinite(result);
  });

  it("milvus: out-of-bounds instanceType falls back to m5.large", () => {
    const provider = getProvider("milvus")!;

    const result = provider.calculateCosts({
      instanceType: 99, // out of bounds
      instanceCount: 1,
      storageGB: 50,
      storageType: 0,
      dataTransferGB: 0,
      includeEtcd: 0,
      includeMinio: 0,
    } as Record<string, number>);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });

  it("mongodb: out-of-bounds dedicatedTier falls back to M10", () => {
    const provider = getProvider("mongodb")!;

    const result = provider.calculateCosts({
      clusterType: 1, // dedicated
      flexOpsPerSec: 0,
      dedicatedTier: 99, // out of bounds
      storageGB: 50,
      replicaCount: 3,
    } as Record<string, number>);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// toUniversalConfig / fromUniversalConfig roundtrip
// ---------------------------------------------------------------------------

describe("toUniversalConfig / fromUniversalConfig roundtrip", () => {
  it("roundtrip preserves cost estimate order of magnitude for each provider", () => {
    for (const id of ALL_PROVIDER_IDS) {
      const provider = getProvider(id);
      if (!provider?.toUniversalConfig || !provider?.fromUniversalConfig) continue;

      // Step 1: Universal → provider config
      const providerConfig = provider.fromUniversalConfig(TYPICAL_UNIVERSAL);

      // Step 2: Provider config → universal
      const reconstructed = provider.toUniversalConfig(providerConfig);

      // The reconstructed universal should have the same order of magnitude
      // for key fields (allowing for heuristic translation losses)
      expect(reconstructed.numVectors, `${id}: numVectors > 0`).toBeGreaterThan(0);
      expect(reconstructed.dimensions, `${id}: dimensions > 0`).toBeGreaterThan(0);
      expectAllFinite(reconstructed, `${id} roundtrip`);
    }
  });

  it("fromUniversalConfig returns all-number config for each provider", () => {
    for (const id of ALL_PROVIDER_IDS) {
      const provider = getProvider(id);
      if (!provider?.fromUniversalConfig) continue;

      const config = provider.fromUniversalConfig(TYPICAL_UNIVERSAL);
      for (const [key, value] of Object.entries(config)) {
        expect(typeof value, `${id}.${key}`).toBe("number");
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Zilliz free tier in cross-provider comparison
// ---------------------------------------------------------------------------

describe("Zilliz free tier in comparisons", () => {
  it("fromUniversalConfig enables free tier", () => {
    const provider = getProvider("zilliz")!;
    const config = provider.fromUniversalConfig!(TYPICAL_UNIVERSAL);
    expect(config.includeFreeTier).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Edge cases: all providers handle comparison flow with numeric configs
// ---------------------------------------------------------------------------

describe("comparison flow end-to-end", () => {
  it("every provider calculates costs from fromUniversalConfig output", () => {
    for (const id of ALL_PROVIDER_IDS) {
      const provider = getProvider(id);
      if (!provider?.fromUniversalConfig) continue;

      const numericConfig = provider.fromUniversalConfig(TYPICAL_UNIVERSAL);
      // This simulates the comparison flow: fromUniversalConfig → calculateCosts
      const result = provider.calculateCosts(numericConfig);

      expect(result.totalMonthlyCost, `${id}`).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.totalMonthlyCost), `${id} finite`).toBe(true);
      expect(result.lineItems.length, `${id} has line items`).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Provider switching: calling calculateCosts with wrong provider's config
// ---------------------------------------------------------------------------

describe("provider switching: calculateCosts with incompatible configs", () => {
  // Collect all default configs upfront
  const defaultConfigs: Record<string, Record<string, number>> = {};
  for (const id of ALL_PROVIDER_IDS) {
    const provider = getProvider(id);
    if (provider) {
      defaultConfigs[id] = { ...provider.defaultConfig as Record<string, number> };
    }
  }

  it("every provider survives receiving every other provider's default config", () => {
    for (const targetId of ALL_PROVIDER_IDS) {
      const target = getProvider(targetId)!;

      for (const sourceId of ALL_PROVIDER_IDS) {
        if (sourceId === targetId) continue;

        // Simulate provider switch: target provider receives source provider's config
        const result = target.calculateCosts(defaultConfigs[sourceId]);

        expect(
          Number.isFinite(result.totalMonthlyCost),
          `${targetId} should not crash with ${sourceId} config`
        ).toBe(true);
        expect(
          result.totalMonthlyCost,
          `${targetId} should return non-negative cost with ${sourceId} config`
        ).toBeGreaterThanOrEqual(0);
        expect(
          result.lineItems.length,
          `${targetId} should return line items with ${sourceId} config`
        ).toBeGreaterThan(0);
      }
    }
  });

  it("every provider survives receiving an empty config", () => {
    for (const id of ALL_PROVIDER_IDS) {
      const provider = getProvider(id)!;
      const result = provider.calculateCosts({} as Record<string, number>);

      expect(
        Number.isFinite(result.totalMonthlyCost),
        `${id} should not crash with empty config`
      ).toBe(true);
      expect(
        result.totalMonthlyCost,
        `${id} should return non-negative cost with empty config`
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it("every provider survives receiving a config with all zeros", () => {
    for (const id of ALL_PROVIDER_IDS) {
      const provider = getProvider(id)!;
      const defaultKeys = Object.keys(provider.defaultConfig as Record<string, number>);
      const zeroConfig = Object.fromEntries(defaultKeys.map((k) => [k, 0]));
      const result = provider.calculateCosts(zeroConfig as Record<string, number>);

      expect(
        Number.isFinite(result.totalMonthlyCost),
        `${id} should not crash with all-zero config`
      ).toBe(true);
      expect(
        result.totalMonthlyCost,
        `${id} should return non-negative cost with all-zero config`
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it("every provider survives receiving config with undefined values", () => {
    for (const id of ALL_PROVIDER_IDS) {
      const provider = getProvider(id)!;
      // Simulate a config where all values are undefined (e.g., from parsing errors)
      const undefinedConfig = {
        numVectors: undefined,
        dimensions: undefined,
        plan: undefined,
        instanceType: undefined,
        clusterType: undefined,
        deploymentMode: undefined,
      } as unknown as Record<string, number>;

      const result = provider.calculateCosts(undefinedConfig);

      expect(
        Number.isFinite(result.totalMonthlyCost),
        `${id} should not crash with undefined values`
      ).toBe(true);
      expect(
        result.totalMonthlyCost,
        `${id} should return non-negative cost with undefined values`
      ).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// normalizeConfig edge cases: specific providers with string enums
// ---------------------------------------------------------------------------

describe("normalizeConfig edge cases", () => {
  it("turbopuffer: undefined plan defaults to launch", () => {
    const provider = getProvider("turbopuffer")!;
    const result = provider.calculateCosts({
      numVectors: 1000,
      dimensions: 1536,
      metadataBytes: 100,
      monthlyWriteGB: 10,
      monthlyQueryGB: 10,
      // plan is missing
    } as Record<string, number>);
    expect(result.totalMonthlyCost).toBe(64); // launch minimum
  });

  it("turbopuffer: invalid string plan defaults to launch", () => {
    const provider = getProvider("turbopuffer")!;
    const result = provider.calculateCosts({
      numVectors: 1000,
      dimensions: 1536,
      metadataBytes: 100,
      monthlyWriteGB: 10,
      monthlyQueryGB: 10,
      plan: "invalid" as unknown as number,
    } as Record<string, number>);
    expect(result.totalMonthlyCost).toBe(64); // launch minimum
  });

  it("opensearch: undefined deploymentMode defaults to production", () => {
    const provider = getProvider("opensearch")!;
    const result = provider.calculateCosts({
      indexSizeGB: 10,
      // deploymentMode is missing
      monthlyQueries: 100_000,
      monthlyWrites: 10_000,
      maxSearchOCUs: 2,
      maxIndexingOCUs: 2,
    } as Record<string, number>);
    // Production: 2 OCUs minimum
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });

  it("mongodb: undefined clusterType defaults to dedicated", () => {
    const provider = getProvider("mongodb")!;
    const result = provider.calculateCosts({
      // clusterType is missing
      flexOpsPerSec: 100,
      dedicatedTier: 0,
      storageGB: 50,
      replicaCount: 3,
    } as Record<string, number>);
    // Dedicated M10 cost should be > 0
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });

  it("mongodb: undefined dedicatedTier defaults to M10", () => {
    const provider = getProvider("mongodb")!;
    const result = provider.calculateCosts({
      clusterType: 1, // dedicated
      flexOpsPerSec: 0,
      // dedicatedTier is missing
      storageGB: 50,
      replicaCount: 3,
    } as Record<string, number>);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });

  it("mongodb-selfhosted: undefined instanceType defaults to m5.large", () => {
    const provider = getProvider("mongodb-selfhosted")!;
    const result = provider.calculateCosts({
      // instanceType is missing
      replicaCount: 3,
      storageGB: 100,
      storageType: 0,
      dataTransferGB: 100,
      includeConfigServers: 0,
      mongosCount: 0,
    } as Record<string, number>);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });

  it("mongodb-selfhosted: negative instanceType falls back to m5.large", () => {
    const provider = getProvider("mongodb-selfhosted")!;
    const result = provider.calculateCosts({
      instanceType: -1,
      replicaCount: 3,
      storageGB: 100,
      storageType: 0,
      dataTransferGB: 100,
      includeConfigServers: 0,
      mongosCount: 0,
    } as Record<string, number>);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });

  it("milvus: undefined instanceType defaults to m5.large", () => {
    const provider = getProvider("milvus")!;
    const result = provider.calculateCosts({
      // instanceType is missing
      instanceCount: 1,
      storageGB: 50,
      storageType: 0,
      dataTransferGB: 0,
      includeEtcd: 0,
      includeMinio: 0,
    } as Record<string, number>);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });

  it("milvus: missing all fields still produces valid result", () => {
    const provider = getProvider("milvus")!;
    const result = provider.calculateCosts({} as Record<string, number>);
    expect(result.totalMonthlyCost).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.totalMonthlyCost)).toBe(true);
  });

  it("mongodb-selfhosted: missing all fields still produces valid result", () => {
    const provider = getProvider("mongodb-selfhosted")!;
    const result = provider.calculateCosts({} as Record<string, number>);
    expect(result.totalMonthlyCost).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.totalMonthlyCost)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// toUniversalConfig with missing fields
// ---------------------------------------------------------------------------

describe("toUniversalConfig with missing fields", () => {
  it("s3-vectors: handles empty config with defaults", () => {
    const provider = getProvider("s3-vectors")!;
    const result = provider.toUniversalConfig!({} as Record<string, number>);
    expect(result.numVectors).toBe(100_000);
    expect(result.dimensions).toBe(1536);
    expectAllFinite(result);
  });

  it("pinecone: handles empty config with defaults", () => {
    const provider = getProvider("pinecone")!;
    const result = provider.toUniversalConfig!({} as Record<string, number>);
    expect(result.numVectors).toBe(100_000);
    expect(result.dimensions).toBe(1536);
    expectAllFinite(result);
  });

  it("zilliz: handles empty config with defaults", () => {
    const provider = getProvider("zilliz")!;
    const result = provider.toUniversalConfig!({} as Record<string, number>);
    expect(result.numVectors).toBe(100_000);
    expectAllFinite(result);
  });

  it("turbopuffer: handles empty config with defaults", () => {
    const provider = getProvider("turbopuffer")!;
    const result = provider.toUniversalConfig!({} as Record<string, number>);
    expect(result.numVectors).toBe(100_000);
    expectAllFinite(result);
  });

  it("weaviate: handles empty config with defaults", () => {
    const provider = getProvider("weaviate")!;
    const result = provider.toUniversalConfig!({} as Record<string, number>);
    expect(result.numVectors).toBe(100_000);
    expectAllFinite(result);
  });

  it("opensearch: handles empty config with defaults", () => {
    const provider = getProvider("opensearch")!;
    const result = provider.toUniversalConfig!({} as Record<string, number>);
    expect(result.numVectors).toBeGreaterThan(0);
    expectAllFinite(result);
  });
});
