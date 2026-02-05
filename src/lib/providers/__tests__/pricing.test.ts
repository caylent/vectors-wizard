import { describe, it, expect } from "vitest";

// Import each provider's calculateCosts and pricing constants
import {
  calculateCosts as calculateS3Costs,
  PRICING as S3_PRICING,
  type CostInputs as S3CostInputs,
} from "@/lib/providers/s3-vectors/pricing";

import {
  calculateCosts as calculatePineconeCosts,
  PRICING as PINECONE_PRICING,
  type CostInputs as PineconeCostInputs,
} from "@/lib/providers/pinecone/pricing";

import {
  calculateCosts as calculateOpenSearchCosts,
  PRICING as OPENSEARCH_PRICING,
  type CostInputs as OpenSearchCostInputs,
} from "@/lib/providers/opensearch/pricing";

import {
  calculateCosts as calculateWeaviateCosts,
  PRICING as WEAVIATE_PRICING,
  type CostInputs as WeaviateCostInputs,
} from "@/lib/providers/weaviate/pricing";

import {
  calculateCosts as calculateZillizCosts,
  PRICING as ZILLIZ_PRICING,
  type CostInputs as ZillizCostInputs,
} from "@/lib/providers/zilliz/pricing";

import {
  calculateCosts as calculateTurbopufferCosts,
  PRICING as TURBOPUFFER_PRICING,
  type CostInputs as TurbopufferCostInputs,
} from "@/lib/providers/turbopuffer/pricing";

import {
  calculateCosts as calculateMongoDBCosts,
  PRICING as MONGODB_PRICING,
  type CostInputs as MongoDBCostInputs,
} from "@/lib/providers/mongodb/pricing";

import {
  calculateCosts as calculateMongoDBSelfHostedCosts,
  PRICING as MONGODB_SH_PRICING,
  type CostInputs as MongoDBSelfHostedCostInputs,
} from "@/lib/providers/mongodb-selfhosted/pricing";

import {
  calculateCosts as calculateMilvusCosts,
  PRICING as MILVUS_PRICING,
  type CostInputs as MilvusCostInputs,
} from "@/lib/providers/milvus/pricing";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Tolerance for floating point comparisons (1 cent). */
const CENT = 0.01;

/**
 * Recursively check that all numeric values in an object are finite
 * (not NaN, not Infinity).
 */
function expectAllFinite(obj: unknown, path = ""): void {
  if (obj === null || obj === undefined) return;
  if (typeof obj === "number") {
    expect(obj, `${path} should be finite`).not.toBeNaN();
    expect(Number.isFinite(obj), `${path} should be finite, got ${obj}`).toBe(
      true
    );
    return;
  }
  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      expectAllFinite(value, path ? `${path}.${key}` : key);
    }
  }
}

// ---------------------------------------------------------------------------
// S3 Vectors
// ---------------------------------------------------------------------------

describe("S3 Vectors pricing", () => {
  const zeroInputs: S3CostInputs = {
    numVectors: 0,
    dimensions: 0,
    avgKeyLengthBytes: 0,
    filterableMetadataBytes: 0,
    nonFilterableMetadataBytes: 0,
    monthlyQueries: 0,
    monthlyVectorsWritten: 0,
    embeddingCostPerMTokens: 0,
    avgTokensPerVector: 0,
    avgTokensPerQuery: 0,
  };

  it("returns zero cost for zero inputs", () => {
    const result = calculateS3Costs(zeroInputs);
    expect(result.totalMonthlyCost).toBe(0);
    expect(result.storage.monthlyCost).toBe(0);
    expect(result.write.monthlyCost).toBe(0);
    expect(result.query.monthlyCost).toBe(0);
    expect(result.embedding.monthlyCost).toBe(0);
  });

  it("components sum to totalMonthlyCost", () => {
    const inputs: S3CostInputs = {
      numVectors: 1_000_000,
      dimensions: 1536,
      avgKeyLengthBytes: 36,
      filterableMetadataBytes: 100,
      nonFilterableMetadataBytes: 200,
      monthlyQueries: 500_000,
      monthlyVectorsWritten: 100_000,
      embeddingCostPerMTokens: 0.1,
      avgTokensPerVector: 256,
      avgTokensPerQuery: 64,
    };
    const result = calculateS3Costs(inputs);
    const componentSum =
      result.storage.monthlyCost +
      result.write.monthlyCost +
      result.query.monthlyCost +
      result.embedding.monthlyCost;
    expect(result.totalMonthlyCost).toBeCloseTo(componentSum, 8);
  });

  it("hand-calculated storage cost is correct", () => {
    // 100,000 vectors, 768 dimensions, 20-byte key, 50 filterable, 0 non-filterable
    // perVectorBytes = 4*768 + 20 + 50 + 0 = 3142 bytes
    // totalBytes = 3142 * 100000 = 314,200,000
    // totalGB = 314200000 / 1073741824 = ~0.29266 GB
    // storageCost = 0.29266 * 0.06 = ~0.01756
    const inputs: S3CostInputs = {
      numVectors: 100_000,
      dimensions: 768,
      avgKeyLengthBytes: 20,
      filterableMetadataBytes: 50,
      nonFilterableMetadataBytes: 0,
      monthlyQueries: 0,
      monthlyVectorsWritten: 0,
      embeddingCostPerMTokens: 0,
      avgTokensPerVector: 0,
      avgTokensPerQuery: 0,
    };
    const result = calculateS3Costs(inputs);

    const expectedPerVectorBytes = 4 * 768 + 20 + 50 + 0; // 3142
    expect(result.storage.perVectorBytes).toBe(expectedPerVectorBytes);

    const expectedTotalBytes = expectedPerVectorBytes * 100_000;
    expect(result.storage.totalBytes).toBe(expectedTotalBytes);

    const expectedGB = expectedTotalBytes / 1024 ** 3;
    expect(result.storage.totalGB).toBeCloseTo(expectedGB, 10);

    const expectedCost = expectedGB * S3_PRICING.storage.perGBMonth;
    expect(result.storage.monthlyCost).toBeCloseTo(expectedCost, 10);
  });

  it("hand-calculated write cost is correct", () => {
    // 50,000 vectors written, 1536 dims, 36-byte key, 100 filterable, 200 non-filterable
    // perVectorBytes = 4*1536 + 36 + 100 + 200 = 6480 bytes
    // totalWriteBytes = 6480 * 50000 = 324,000,000
    // totalWriteGB = 324000000 / 1073741824 = ~0.30175 GB
    // writeCost = 0.30175 * 0.20 = ~0.06035
    const inputs: S3CostInputs = {
      numVectors: 1_000_000, // stored vectors (affects storage, not write)
      dimensions: 1536,
      avgKeyLengthBytes: 36,
      filterableMetadataBytes: 100,
      nonFilterableMetadataBytes: 200,
      monthlyQueries: 0,
      monthlyVectorsWritten: 50_000,
      embeddingCostPerMTokens: 0,
      avgTokensPerVector: 0,
      avgTokensPerQuery: 0,
    };
    const result = calculateS3Costs(inputs);

    const expectedPerVectorBytes = 4 * 1536 + 36 + 100 + 200; // 6480
    expect(result.write.perVectorBytes).toBe(expectedPerVectorBytes);

    const expectedWriteBytes = expectedPerVectorBytes * 50_000;
    expect(result.write.totalBytes).toBe(expectedWriteBytes);

    const expectedGB = expectedWriteBytes / 1024 ** 3;
    const expectedCost = expectedGB * S3_PRICING.write.perGBUploaded;
    expect(result.write.monthlyCost).toBeCloseTo(expectedCost, 10);
  });

  it("hand-calculated query API calls cost is correct", () => {
    // 2,000,000 queries
    // apiCallsCost = (2000000 / 1000000) * 2.50 = $5.00
    const inputs: S3CostInputs = {
      numVectors: 0,
      dimensions: 0,
      avgKeyLengthBytes: 0,
      filterableMetadataBytes: 0,
      nonFilterableMetadataBytes: 0,
      monthlyQueries: 2_000_000,
      monthlyVectorsWritten: 0,
      embeddingCostPerMTokens: 0,
      avgTokensPerVector: 0,
      avgTokensPerQuery: 0,
    };
    const result = calculateS3Costs(inputs);
    expect(result.query.apiCallsCost).toBeCloseTo(5.0, 10);
    // Data processed should be 0 since numVectors=0
    expect(result.query.dataProcessedCost).toBe(0);
  });

  describe("tiered query data processed pricing", () => {
    // Helper to build inputs focused on query data processed cost
    function queryInputs(numVectors: number, monthlyQueries: number): S3CostInputs {
      return {
        numVectors,
        dimensions: 256,
        avgKeyLengthBytes: 16,
        filterableMetadataBytes: 32,
        nonFilterableMetadataBytes: 0, // excluded from query scan
        monthlyQueries,
        monthlyVectorsWritten: 0,
        embeddingCostPerMTokens: 0,
        avgTokensPerVector: 0,
        avgTokensPerQuery: 0,
      };
    }

    it("uses tier1 rate at exactly 100,000 vectors", () => {
      const result = calculateS3Costs(queryInputs(100_000, 1000));
      // queryVectorSizeBytes = 4*256 + 16 + 32 = 1072
      // perQueryScanBytes = 1072 * 100000 = 107,200,000
      // totalProcessedBytes = 107200000 * 1000 = 107,200,000,000
      // totalProcessedTB = 107200000000 / 1024^4 = ~0.097498 TB
      // cost = 0.097498 * 0.004 = ~0.000390
      const queryVecBytes = 4 * 256 + 16 + 32; // 1072
      const totalProcessedBytes = queryVecBytes * 100_000 * 1000;
      const totalProcessedTB = totalProcessedBytes / 1024 ** 4;
      const expectedCost =
        totalProcessedTB * S3_PRICING.query.dataProcessed.tier1.perTB;

      expect(result.query.dataProcessedCost).toBeCloseTo(expectedCost, 10);
    });

    it("uses blended rate at 100,001 vectors (tier boundary)", () => {
      const result = calculateS3Costs(queryInputs(100_001, 1000));
      // With 100001 vectors, blended rate applies:
      // tier1Fraction = 100000 / 100001
      // tier2Fraction = 1 / 100001
      // blendedRate = tier1Fraction * 0.004 + tier2Fraction * 0.002
      const numVectors = 100_001;
      const queryVecBytes = 4 * 256 + 16 + 32; // 1072
      const totalProcessedBytes = queryVecBytes * numVectors * 1000;
      const totalProcessedTB = totalProcessedBytes / 1024 ** 4;
      const tier1Fraction = 100_000 / numVectors;
      const tier2Fraction = 1 - tier1Fraction;
      const blendedRate =
        tier1Fraction * S3_PRICING.query.dataProcessed.tier1.perTB +
        tier2Fraction * S3_PRICING.query.dataProcessed.tier2.perTB;
      const expectedCost = totalProcessedTB * blendedRate;

      expect(result.query.dataProcessedCost).toBeCloseTo(expectedCost, 10);
    });

    it("blended rate at 100,001 is cheaper per-TB than tier1", () => {
      // The blended rate should be very slightly less than pure tier1,
      // because 1 vector out of 100001 is at the cheaper tier2 rate.
      const resultTier1 = calculateS3Costs(queryInputs(100_000, 1000));
      const resultBlended = calculateS3Costs(queryInputs(100_001, 1000));

      // Cost goes up (more vectors scanned) but per-TB rate decreases
      const perTBTier1 =
        resultTier1.query.dataProcessedCost /
        resultTier1.query.dataProcessedTB;
      const perTBBlended =
        resultBlended.query.dataProcessedCost /
        resultBlended.query.dataProcessedTB;

      expect(perTBBlended).toBeLessThan(perTBTier1);
    });

    it("large vector count uses mostly tier2 rate", () => {
      const result = calculateS3Costs(queryInputs(10_000_000, 100));
      // tier1Fraction = 100000 / 10000000 = 0.01
      // tier2Fraction = 0.99
      // blendedRate should be close to 0.002
      const tier1Fraction = 100_000 / 10_000_000;
      const tier2Fraction = 1 - tier1Fraction;
      const blendedRate =
        tier1Fraction * S3_PRICING.query.dataProcessed.tier1.perTB +
        tier2Fraction * S3_PRICING.query.dataProcessed.tier2.perTB;
      // blendedRate should be close to 0.002 (pure tier2)
      expect(blendedRate).toBeCloseTo(0.00202, 4);

      const queryVecBytes = 4 * 256 + 16 + 32;
      const totalProcessedBytes = queryVecBytes * 10_000_000 * 100;
      const totalProcessedTB = totalProcessedBytes / 1024 ** 4;
      const expectedCost = totalProcessedTB * blendedRate;
      expect(result.query.dataProcessedCost).toBeCloseTo(expectedCost, 10);
    });
  });

  it("embedding cost calculated correctly", () => {
    // embeddingCostPerMTokens = 0.10 ($0.10 per million tokens)
    // monthlyVectorsWritten = 100000, avgTokensPerVector = 512
    // monthlyQueries = 50000, avgTokensPerQuery = 128
    // writeTokens = 100000 * 512 = 51,200,000
    // queryTokens = 50000 * 128 = 6,400,000
    // totalTokens = 57,600,000
    // costPerToken = 0.10 / 1,000,000 = 0.0000001
    // embeddingCost = 57600000 * 0.0000001 = $5.76
    const inputs: S3CostInputs = {
      numVectors: 0,
      dimensions: 0,
      avgKeyLengthBytes: 0,
      filterableMetadataBytes: 0,
      nonFilterableMetadataBytes: 0,
      monthlyQueries: 50_000,
      monthlyVectorsWritten: 100_000,
      embeddingCostPerMTokens: 0.10,
      avgTokensPerVector: 512,
      avgTokensPerQuery: 128,
    };
    const result = calculateS3Costs(inputs);
    expect(result.embedding.writeTokens).toBe(51_200_000);
    expect(result.embedding.queryTokens).toBe(6_400_000);
    expect(result.embedding.totalTokens).toBe(57_600_000);
    expect(result.embedding.monthlyCost).toBeCloseTo(5.76, 8);
  });

  it("handles large inputs without NaN or Infinity", () => {
    const inputs: S3CostInputs = {
      numVectors: 1_000_000_000,
      dimensions: 4096,
      avgKeyLengthBytes: 256,
      filterableMetadataBytes: 1024,
      nonFilterableMetadataBytes: 4096,
      monthlyQueries: 100_000_000,
      monthlyVectorsWritten: 50_000_000,
      embeddingCostPerMTokens: 10,
      avgTokensPerVector: 2048,
      avgTokensPerQuery: 512,
    };
    const result = calculateS3Costs(inputs);
    expectAllFinite(result);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });

  it("non-filterable metadata excluded from query data scan", () => {
    const baseInputs: S3CostInputs = {
      numVectors: 10_000,
      dimensions: 128,
      avgKeyLengthBytes: 16,
      filterableMetadataBytes: 0,
      nonFilterableMetadataBytes: 0,
      monthlyQueries: 1000,
      monthlyVectorsWritten: 0,
      embeddingCostPerMTokens: 0,
      avgTokensPerVector: 0,
      avgTokensPerQuery: 0,
    };
    const resultNoMeta = calculateS3Costs(baseInputs);

    // Adding non-filterable metadata should NOT change query data processed cost
    const resultWithMeta = calculateS3Costs({
      ...baseInputs,
      nonFilterableMetadataBytes: 500,
    });
    expect(resultWithMeta.query.dataProcessedCost).toBe(
      resultNoMeta.query.dataProcessedCost
    );
    expect(resultWithMeta.query.dataProcessedBytes).toBe(
      resultNoMeta.query.dataProcessedBytes
    );

    // But storage cost should increase
    expect(resultWithMeta.storage.monthlyCost).toBeGreaterThan(
      resultNoMeta.storage.monthlyCost
    );
  });
});

// ---------------------------------------------------------------------------
// Pinecone
// ---------------------------------------------------------------------------

describe("Pinecone pricing", () => {
  const zeroInputs: PineconeCostInputs = {
    numVectors: 0,
    dimensions: 0,
    metadataBytes: 0,
    monthlyQueries: 0,
    monthlyUpserts: 0,
    embeddingCostPerMTokens: 0,
    avgTokensPerVector: 0,
    avgTokensPerQuery: 0,
  };

  it("returns minimum cost ($50) for zero inputs", () => {
    const result = calculatePineconeCosts(zeroInputs);
    expect(result.totalMonthlyCost).toBe(PINECONE_PRICING.minimum);
    expect(result.subtotal).toBe(0);
  });

  it("enforces $50 minimum even with small usage", () => {
    const result = calculatePineconeCosts({
      ...zeroInputs,
      numVectors: 1000,
      dimensions: 128,
    });
    expect(result.totalMonthlyCost).toBe(PINECONE_PRICING.minimum);
    expect(result.subtotal).toBeLessThan(PINECONE_PRICING.minimum);
  });

  it("exceeds minimum with large usage", () => {
    const inputs: PineconeCostInputs = {
      numVectors: 10_000_000,
      dimensions: 1536,
      metadataBytes: 100,
      monthlyQueries: 50_000_000,
      monthlyUpserts: 5_000_000,
      embeddingCostPerMTokens: 0,
      avgTokensPerVector: 0,
      avgTokensPerQuery: 0,
    };
    const result = calculatePineconeCosts(inputs);
    expect(result.totalMonthlyCost).toBeGreaterThan(PINECONE_PRICING.minimum);
    expect(result.totalMonthlyCost).toBe(result.subtotal);
  });

  it("hand-calculated read/write costs", () => {
    // 10M queries: (10,000,000 / 1,000,000) * 16 = $160
    // 2M upserts: (2,000,000 / 1,000,000) * 4 = $8
    const inputs: PineconeCostInputs = {
      numVectors: 0,
      dimensions: 0,
      metadataBytes: 0,
      monthlyQueries: 10_000_000,
      monthlyUpserts: 2_000_000,
      embeddingCostPerMTokens: 0,
      avgTokensPerVector: 0,
      avgTokensPerQuery: 0,
    };
    const result = calculatePineconeCosts(inputs);
    expect(result.reads.monthlyCost).toBeCloseTo(160, 8);
    expect(result.writes.monthlyCost).toBeCloseTo(8, 8);
  });

  it("components sum to subtotal and totalMonthlyCost", () => {
    const inputs: PineconeCostInputs = {
      numVectors: 1_000_000,
      dimensions: 768,
      metadataBytes: 50,
      monthlyQueries: 5_000_000,
      monthlyUpserts: 500_000,
      embeddingCostPerMTokens: 0.1,
      avgTokensPerVector: 256,
      avgTokensPerQuery: 64,
    };
    const result = calculatePineconeCosts(inputs);
    const componentSum =
      result.storage.monthlyCost +
      result.reads.monthlyCost +
      result.writes.monthlyCost +
      result.embedding.monthlyCost;
    expect(result.subtotal).toBeCloseTo(componentSum, 8);
    expect(result.totalMonthlyCost).toBe(
      Math.max(PINECONE_PRICING.minimum, result.subtotal)
    );
  });

  it("handles large inputs without NaN or Infinity", () => {
    const inputs: PineconeCostInputs = {
      numVectors: 1_000_000_000,
      dimensions: 4096,
      metadataBytes: 2048,
      monthlyQueries: 1_000_000_000,
      monthlyUpserts: 100_000_000,
      embeddingCostPerMTokens: 10,
      avgTokensPerVector: 2048,
      avgTokensPerQuery: 512,
    };
    const result = calculatePineconeCosts(inputs);
    expectAllFinite(result);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// OpenSearch Serverless
// ---------------------------------------------------------------------------

describe("OpenSearch Serverless pricing", () => {
  const minimalInputs: OpenSearchCostInputs = {
    indexSizeGB: 0,
    deploymentMode: "production",
    monthlyQueries: 0,
    monthlyWrites: 0,
    maxSearchOCUs: 10,
    maxIndexingOCUs: 10,
  };

  it("has minimum OCU cost even with zero workload (production)", () => {
    const result = calculateOpenSearchCosts(minimalInputs);
    // production: 1 search OCU + 1 indexing OCU = 2 OCUs minimum
    // 2 * 0.24 * 730 = $350.40
    expect(result.compute.totalOCUs).toBe(2);
    expect(result.compute.monthlyCost).toBeCloseTo(
      2 * OPENSEARCH_PRICING.ocu.perHour * OPENSEARCH_PRICING.hoursPerMonth,
      CENT
    );
    expect(result.storage.monthlyCost).toBe(0);
  });

  it("dev-test mode uses lower minimum OCUs", () => {
    const result = calculateOpenSearchCosts({
      ...minimalInputs,
      deploymentMode: "dev-test",
    });
    // dev-test: 0.5 search + 0.5 indexing = 1 OCU
    expect(result.compute.totalOCUs).toBe(1);
    expect(result.compute.monthlyCost).toBeCloseTo(
      1 * OPENSEARCH_PRICING.ocu.perHour * OPENSEARCH_PRICING.hoursPerMonth,
      CENT
    );
  });

  it("hand-calculated storage cost", () => {
    // 100 GB storage: 100 * 0.024 = $2.40
    const result = calculateOpenSearchCosts({
      ...minimalInputs,
      indexSizeGB: 100,
    });
    expect(result.storage.monthlyCost).toBeCloseTo(2.4, 8);
  });

  it("components sum to totalMonthlyCost", () => {
    const result = calculateOpenSearchCosts({
      indexSizeGB: 50,
      deploymentMode: "production",
      monthlyQueries: 10_000_000,
      monthlyWrites: 5_000_000,
      maxSearchOCUs: 20,
      maxIndexingOCUs: 20,
    });
    expect(result.totalMonthlyCost).toBeCloseTo(
      result.compute.monthlyCost + result.storage.monthlyCost,
      8
    );
  });

  it("respects maxOCU caps", () => {
    // Extreme workload but capped at 2 OCUs each
    const result = calculateOpenSearchCosts({
      indexSizeGB: 1000,
      deploymentMode: "production",
      monthlyQueries: 1_000_000_000,
      monthlyWrites: 1_000_000_000,
      maxSearchOCUs: 2,
      maxIndexingOCUs: 2,
    });
    expect(result.compute.searchOCUs).toBeLessThanOrEqual(2);
    expect(result.compute.indexingOCUs).toBeLessThanOrEqual(2);
  });

  it("handles large inputs without NaN or Infinity", () => {
    const result = calculateOpenSearchCosts({
      indexSizeGB: 100_000,
      deploymentMode: "production",
      monthlyQueries: 10_000_000_000,
      monthlyWrites: 10_000_000_000,
      maxSearchOCUs: 100,
      maxIndexingOCUs: 100,
    });
    expectAllFinite(result);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Weaviate Cloud
// ---------------------------------------------------------------------------

describe("Weaviate Cloud pricing", () => {
  const zeroInputs: WeaviateCostInputs = {
    numObjects: 0,
    dimensions: 0,
    replicationFactor: 1,
    storageGiB: 0,
    backupGiB: 0,
  };

  it("returns minimum cost ($45) for zero inputs", () => {
    const result = calculateWeaviateCosts(zeroInputs);
    expect(result.subtotal).toBe(0);
    expect(result.totalMonthlyCost).toBe(WEAVIATE_PRICING.minimum);
  });

  it("hand-calculated dimension cost", () => {
    // 1,000,000 objects * 768 dims * 2 replicas = 1,536,000,000 total dims
    // (1536000000 / 1000000) * 0.0139 = $21,350.40
    const inputs: WeaviateCostInputs = {
      numObjects: 1_000_000,
      dimensions: 768,
      replicationFactor: 2,
      storageGiB: 0,
      backupGiB: 0,
    };
    const result = calculateWeaviateCosts(inputs);
    const expectedDimCost = (1_000_000 * 768 * 2 / 1_000_000) * WEAVIATE_PRICING.dimensions.perMillion;
    expect(result.dimensions.monthlyCost).toBeCloseTo(expectedDimCost, 6);
  });

  it("storage and backup costs add up", () => {
    const inputs: WeaviateCostInputs = {
      numObjects: 0,
      dimensions: 0,
      replicationFactor: 1,
      storageGiB: 100,
      backupGiB: 50,
    };
    const result = calculateWeaviateCosts(inputs);
    expect(result.storage.monthlyCost).toBeCloseTo(100 * WEAVIATE_PRICING.storage.perGiB, 6);
    expect(result.backup.monthlyCost).toBeCloseTo(50 * WEAVIATE_PRICING.backup.perGiB, 6);
  });

  it("components sum to subtotal", () => {
    const inputs: WeaviateCostInputs = {
      numObjects: 500_000,
      dimensions: 384,
      replicationFactor: 3,
      storageGiB: 50,
      backupGiB: 25,
    };
    const result = calculateWeaviateCosts(inputs);
    const componentSum =
      result.dimensions.monthlyCost +
      result.storage.monthlyCost +
      result.backup.monthlyCost;
    expect(result.subtotal).toBeCloseTo(componentSum, 8);
    expect(result.totalMonthlyCost).toBe(
      Math.max(WEAVIATE_PRICING.minimum, result.subtotal)
    );
  });

  it("handles large inputs without NaN or Infinity", () => {
    const result = calculateWeaviateCosts({
      numObjects: 100_000_000,
      dimensions: 4096,
      replicationFactor: 3,
      storageGiB: 10_000,
      backupGiB: 5_000,
    });
    expectAllFinite(result);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Zilliz Cloud Serverless
// ---------------------------------------------------------------------------

describe("Zilliz Cloud pricing", () => {
  const zeroInputs: ZillizCostInputs = {
    numVectors: 0,
    dimensions: 0,
    metadataBytes: 0,
    monthlyQueries: 0,
    monthlyWrites: 0,
    includeFreeTier: 0,
  };

  it("returns zero cost for zero inputs (no free tier)", () => {
    const result = calculateZillizCosts(zeroInputs);
    expect(result.totalMonthlyCost).toBe(0);
  });

  it("free tier subtracts storage and compute credits", () => {
    const inputs: ZillizCostInputs = {
      numVectors: 100_000,
      dimensions: 128,
      metadataBytes: 0,
      monthlyQueries: 1_000_000,
      monthlyWrites: 500_000,
      includeFreeTier: 1,
    };
    const resultFree = calculateZillizCosts(inputs);
    const resultPaid = calculateZillizCosts({ ...inputs, includeFreeTier: 0 });

    expect(resultFree.storage.freeGB).toBe(ZILLIZ_PRICING.freeTier.storageGB);
    expect(resultFree.compute.freeVCUs).toBe(
      ZILLIZ_PRICING.freeTier.vcuMillions * 1_000_000
    );
    expect(resultFree.totalMonthlyCost).toBeLessThanOrEqual(
      resultPaid.totalMonthlyCost
    );
  });

  it("write operations consume 2x vCUs vs queries", () => {
    const inputs: ZillizCostInputs = {
      numVectors: 0,
      dimensions: 0,
      metadataBytes: 0,
      monthlyQueries: 1_000_000,
      monthlyWrites: 1_000_000,
      includeFreeTier: 0,
    };
    const result = calculateZillizCosts(inputs);
    expect(result.compute.writeVCUs).toBe(2 * result.compute.queryVCUs);
  });

  it("components sum to totalMonthlyCost", () => {
    const inputs: ZillizCostInputs = {
      numVectors: 5_000_000,
      dimensions: 768,
      metadataBytes: 100,
      monthlyQueries: 10_000_000,
      monthlyWrites: 1_000_000,
      includeFreeTier: 0,
    };
    const result = calculateZillizCosts(inputs);
    expect(result.totalMonthlyCost).toBeCloseTo(
      result.storage.monthlyCost + result.compute.monthlyCost,
      8
    );
  });

  it("handles large inputs without NaN or Infinity", () => {
    const result = calculateZillizCosts({
      numVectors: 1_000_000_000,
      dimensions: 4096,
      metadataBytes: 1024,
      monthlyQueries: 1_000_000_000,
      monthlyWrites: 100_000_000,
      includeFreeTier: 0,
    });
    expectAllFinite(result);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// TurboPuffer
// ---------------------------------------------------------------------------

describe("TurboPuffer pricing", () => {
  const zeroInputs: TurbopufferCostInputs = {
    numVectors: 0,
    dimensions: 0,
    metadataBytes: 0,
    monthlyWriteGB: 0,
    monthlyQueryGB: 0,
    plan: "launch",
  };

  it("returns plan minimum for zero inputs", () => {
    const result = calculateTurbopufferCosts(zeroInputs);
    expect(result.totalMonthlyCost).toBe(TURBOPUFFER_PRICING.minimum.launch);
    expect(result.subtotal).toBe(0);
  });

  it("different plans have different minimums", () => {
    const launchResult = calculateTurbopufferCosts({
      ...zeroInputs,
      plan: "launch",
    });
    const scaleResult = calculateTurbopufferCosts({
      ...zeroInputs,
      plan: "scale",
    });
    const enterpriseResult = calculateTurbopufferCosts({
      ...zeroInputs,
      plan: "enterprise",
    });
    expect(launchResult.totalMonthlyCost).toBe(64);
    expect(scaleResult.totalMonthlyCost).toBe(256);
    expect(enterpriseResult.totalMonthlyCost).toBe(4096);
  });

  it("hand-calculated write and query costs with discounts", () => {
    // Writes: 100 GB * $0.10 * (1 - 0.5/2) = 100 * 0.10 * 0.75 = $7.50
    // Queries: 200 GB * $0.05 * (1 - 0.8/2) = 200 * 0.05 * 0.60 = $6.00
    const inputs: TurbopufferCostInputs = {
      numVectors: 0,
      dimensions: 0,
      metadataBytes: 0,
      monthlyWriteGB: 100,
      monthlyQueryGB: 200,
      plan: "launch",
    };
    const result = calculateTurbopufferCosts(inputs);
    expect(result.writes.monthlyCost).toBeCloseTo(7.5, 6);
    expect(result.queries.monthlyCost).toBeCloseTo(6.0, 6);
  });

  it("components sum to subtotal", () => {
    const inputs: TurbopufferCostInputs = {
      numVectors: 10_000_000,
      dimensions: 768,
      metadataBytes: 100,
      monthlyWriteGB: 50,
      monthlyQueryGB: 200,
      plan: "scale",
    };
    const result = calculateTurbopufferCosts(inputs);
    const componentSum =
      result.storage.monthlyCost +
      result.writes.monthlyCost +
      result.queries.monthlyCost;
    expect(result.subtotal).toBeCloseTo(componentSum, 8);
    expect(result.totalMonthlyCost).toBe(
      Math.max(result.minimum, result.subtotal)
    );
  });

  it("handles large inputs without NaN or Infinity", () => {
    const result = calculateTurbopufferCosts({
      numVectors: 1_000_000_000,
      dimensions: 4096,
      metadataBytes: 2048,
      monthlyWriteGB: 100_000,
      monthlyQueryGB: 1_000_000,
      plan: "enterprise",
    });
    expectAllFinite(result);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// MongoDB Atlas
// ---------------------------------------------------------------------------

describe("MongoDB Atlas pricing", () => {
  it("flex tier: returns correct price for 100 ops/sec", () => {
    const result = calculateMongoDBCosts({
      clusterType: "flex",
      flexOpsPerSec: 100,
      dedicatedTier: "M10",
      storageGB: 0,
      replicaCount: 1,
    });
    expect(result.totalMonthlyCost).toBe(8);
    expect(result.storage.included).toBe(true);
  });

  it("flex tier: scales with ops/sec tiers", () => {
    const costs = [100, 200, 300, 400, 500].map((ops) =>
      calculateMongoDBCosts({
        clusterType: "flex",
        flexOpsPerSec: ops,
        dedicatedTier: "M10",
        storageGB: 0,
        replicaCount: 1,
      }).totalMonthlyCost
    );
    expect(costs).toEqual([8, 15, 21, 26, 30]);
  });

  it("dedicated tier: hand-calculated M10 cost", () => {
    // M10: $0.08/hr * 730 hrs = $58.40 per node
    // 3 replicas: $58.40 * 3 = $175.20
    const result = calculateMongoDBCosts({
      clusterType: "dedicated",
      flexOpsPerSec: 0,
      dedicatedTier: "M10",
      storageGB: 50,
      replicaCount: 3,
    });
    const expectedPerNode = 0.08 * MONGODB_PRICING.hoursPerMonth;
    expect(result.compute.perNodeCost).toBeCloseTo(expectedPerNode, 6);
    expect(result.totalMonthlyCost).toBeCloseTo(expectedPerNode * 3, 6);
  });

  it("dedicated tier: storage included up to tier max", () => {
    const result = calculateMongoDBCosts({
      clusterType: "dedicated",
      flexOpsPerSec: 0,
      dedicatedTier: "M30",
      storageGB: 500,
      replicaCount: 3,
    });
    // M30 storageMax = 512, so 500 is included
    expect(result.storage.included).toBe(true);
    expect(result.storage.additionalCost).toBe(0);
  });

  it("components sum to totalMonthlyCost (dedicated)", () => {
    const result = calculateMongoDBCosts({
      clusterType: "dedicated",
      flexOpsPerSec: 0,
      dedicatedTier: "M50",
      storageGB: 200,
      replicaCount: 3,
    });
    // For dedicated, totalMonthlyCost = compute only (storage included in tier)
    expect(result.totalMonthlyCost).toBe(result.compute.monthlyCost);
  });

  it("handles large inputs without NaN or Infinity", () => {
    const result = calculateMongoDBCosts({
      clusterType: "dedicated",
      flexOpsPerSec: 0,
      dedicatedTier: "M80",
      storageGB: 4096,
      replicaCount: 5,
    });
    expectAllFinite(result);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// MongoDB Self-Hosted
// ---------------------------------------------------------------------------

describe("MongoDB Self-Hosted pricing", () => {
  const baseInputs: MongoDBSelfHostedCostInputs = {
    instanceType: "m5.large",
    replicaCount: 3,
    storageGB: 100,
    storageType: "gp3",
    dataTransferGB: 0,
    includeConfigServers: 0,
    mongosCount: 0,
  };

  it("hand-calculated compute and storage cost", () => {
    // m5.large: $0.096/hr * 730 = $70.08 per instance
    // 3 replicas: $70.08 * 3 = $210.24
    // Storage: 100 GB * $0.08 * 3 replicas = $24.00
    // Total = $234.24
    const result = calculateMongoDBSelfHostedCosts(baseInputs);
    const expectedCompute = 0.096 * MONGODB_SH_PRICING.hoursPerMonth * 3;
    expect(result.compute.monthlyCost).toBeCloseTo(expectedCompute, 6);
    expect(result.storage.monthlyCost).toBeCloseTo(24.0, 6);
    expect(result.totalMonthlyCost).toBeCloseTo(expectedCompute + 24.0, 6);
  });

  it("data transfer: first 100GB free", () => {
    const result100 = calculateMongoDBSelfHostedCosts({
      ...baseInputs,
      dataTransferGB: 100,
    });
    expect(result100.dataTransfer.monthlyCost).toBe(0);

    const result200 = calculateMongoDBSelfHostedCosts({
      ...baseInputs,
      dataTransferGB: 200,
    });
    // 100 GB billable * $0.09 = $9.00
    expect(result200.dataTransfer.monthlyCost).toBeCloseTo(9.0, 6);
  });

  it("sharded cluster adds config servers and mongos", () => {
    const result = calculateMongoDBSelfHostedCosts({
      ...baseInputs,
      includeConfigServers: 1,
      mongosCount: 2,
    });
    expect(result.configServers.included).toBe(true);
    expect(result.configServers.monthlyCost).toBeGreaterThan(0);
    expect(result.mongos.count).toBe(2);
    expect(result.mongos.monthlyCost).toBeGreaterThan(0);
  });

  it("no sharded components when includeConfigServers = 0", () => {
    const result = calculateMongoDBSelfHostedCosts({
      ...baseInputs,
      includeConfigServers: 0,
      mongosCount: 5, // should be ignored
    });
    expect(result.configServers.monthlyCost).toBe(0);
    expect(result.mongos.monthlyCost).toBe(0);
    expect(result.mongos.count).toBe(0);
  });

  it("components sum to totalMonthlyCost", () => {
    const result = calculateMongoDBSelfHostedCosts({
      instanceType: "r5.2xlarge",
      replicaCount: 3,
      storageGB: 500,
      storageType: "io1",
      dataTransferGB: 500,
      includeConfigServers: 1,
      mongosCount: 3,
    });
    const componentSum =
      result.compute.monthlyCost +
      result.storage.monthlyCost +
      result.dataTransfer.monthlyCost +
      result.configServers.monthlyCost +
      result.mongos.monthlyCost;
    expect(result.totalMonthlyCost).toBeCloseTo(componentSum, 8);
  });

  it("handles large inputs without NaN or Infinity", () => {
    const result = calculateMongoDBSelfHostedCosts({
      instanceType: "r5.4xlarge",
      replicaCount: 10,
      storageGB: 10_000,
      storageType: "io1",
      dataTransferGB: 50_000,
      includeConfigServers: 1,
      mongosCount: 5,
    });
    expectAllFinite(result);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Milvus Self-Hosted
// ---------------------------------------------------------------------------

describe("Milvus Self-Hosted pricing", () => {
  const baseInputs: MilvusCostInputs = {
    instanceType: "m5.large",
    instanceCount: 3,
    storageGB: 100,
    storageType: "gp3",
    dataTransferGB: 0,
    includeEtcd: 0,
    includeMinio: 0,
  };

  it("hand-calculated compute and storage cost", () => {
    // m5.large: $0.096/hr * 730 = $70.08 per instance
    // 3 instances: $70.08 * 3 = $210.24
    // Storage: 100 GB * $0.08 * 3 = $24.00
    const result = calculateMilvusCosts(baseInputs);
    const expectedCompute = 0.096 * MILVUS_PRICING.hoursPerMonth * 3;
    expect(result.compute.monthlyCost).toBeCloseTo(expectedCompute, 6);
    expect(result.storage.monthlyCost).toBeCloseTo(24.0, 6);
    expect(result.totalMonthlyCost).toBeCloseTo(expectedCompute + 24.0, 6);
  });

  it("etcd cluster adds 3 t3.small instances", () => {
    const result = calculateMilvusCosts({
      ...baseInputs,
      includeEtcd: 1,
    });
    // 3 * t3.small ($0.0208/hr) * 730 = $45.552
    const expectedEtcd = 0.0208 * MILVUS_PRICING.hoursPerMonth * 3;
    expect(result.etcd.included).toBe(true);
    expect(result.etcd.monthlyCost).toBeCloseTo(expectedEtcd, 6);
  });

  it("MinIO adds 2 t3.medium instances", () => {
    const result = calculateMilvusCosts({
      ...baseInputs,
      includeMinio: 1,
    });
    // 2 * t3.medium ($0.0416/hr) * 730 = $60.736
    const expectedMinio = 0.0416 * MILVUS_PRICING.hoursPerMonth * 2;
    expect(result.minio.included).toBe(true);
    expect(result.minio.monthlyCost).toBeCloseTo(expectedMinio, 6);
  });

  it("data transfer: first 100GB free", () => {
    const result50 = calculateMilvusCosts({
      ...baseInputs,
      dataTransferGB: 50,
    });
    expect(result50.dataTransfer.monthlyCost).toBe(0);

    const result300 = calculateMilvusCosts({
      ...baseInputs,
      dataTransferGB: 300,
    });
    // 200 GB billable * $0.09 = $18.00
    expect(result300.dataTransfer.monthlyCost).toBeCloseTo(18.0, 6);
  });

  it("components sum to totalMonthlyCost", () => {
    const result = calculateMilvusCosts({
      instanceType: "r5.2xlarge",
      instanceCount: 5,
      storageGB: 500,
      storageType: "io1",
      dataTransferGB: 500,
      includeEtcd: 1,
      includeMinio: 1,
    });
    const componentSum =
      result.compute.monthlyCost +
      result.storage.monthlyCost +
      result.dataTransfer.monthlyCost +
      result.etcd.monthlyCost +
      result.minio.monthlyCost;
    expect(result.totalMonthlyCost).toBeCloseTo(componentSum, 8);
  });

  it("handles large inputs without NaN or Infinity", () => {
    const result = calculateMilvusCosts({
      instanceType: "r5.2xlarge",
      instanceCount: 20,
      storageGB: 50_000,
      storageType: "io1",
      dataTransferGB: 100_000,
      includeEtcd: 1,
      includeMinio: 1,
    });
    expectAllFinite(result);
    expect(result.totalMonthlyCost).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Cross-provider: structural validation
// ---------------------------------------------------------------------------

describe("Cross-provider structural checks", () => {
  it("all providers return non-negative totalMonthlyCost for typical inputs", () => {
    // S3 Vectors
    const s3 = calculateS3Costs({
      numVectors: 100_000,
      dimensions: 768,
      avgKeyLengthBytes: 36,
      filterableMetadataBytes: 100,
      nonFilterableMetadataBytes: 50,
      monthlyQueries: 100_000,
      monthlyVectorsWritten: 10_000,
      embeddingCostPerMTokens: 0.1,
      avgTokensPerVector: 256,
      avgTokensPerQuery: 64,
    });
    expect(s3.totalMonthlyCost).toBeGreaterThanOrEqual(0);

    // Pinecone
    const pinecone = calculatePineconeCosts({
      numVectors: 100_000,
      dimensions: 768,
      metadataBytes: 100,
      monthlyQueries: 100_000,
      monthlyUpserts: 10_000,
      embeddingCostPerMTokens: 0.1,
      avgTokensPerVector: 256,
      avgTokensPerQuery: 64,
    });
    expect(pinecone.totalMonthlyCost).toBeGreaterThanOrEqual(0);

    // OpenSearch
    const opensearch = calculateOpenSearchCosts({
      indexSizeGB: 10,
      deploymentMode: "production",
      monthlyQueries: 100_000,
      monthlyWrites: 10_000,
      maxSearchOCUs: 10,
      maxIndexingOCUs: 10,
    });
    expect(opensearch.totalMonthlyCost).toBeGreaterThanOrEqual(0);

    // Weaviate
    const weaviate = calculateWeaviateCosts({
      numObjects: 100_000,
      dimensions: 768,
      replicationFactor: 1,
      storageGiB: 10,
      backupGiB: 5,
    });
    expect(weaviate.totalMonthlyCost).toBeGreaterThanOrEqual(0);

    // Zilliz
    const zilliz = calculateZillizCosts({
      numVectors: 100_000,
      dimensions: 768,
      metadataBytes: 100,
      monthlyQueries: 100_000,
      monthlyWrites: 10_000,
      includeFreeTier: 0,
    });
    expect(zilliz.totalMonthlyCost).toBeGreaterThanOrEqual(0);

    // TurboPuffer
    const turbopuffer = calculateTurbopufferCosts({
      numVectors: 100_000,
      dimensions: 768,
      metadataBytes: 100,
      monthlyWriteGB: 10,
      monthlyQueryGB: 50,
      plan: "launch",
    });
    expect(turbopuffer.totalMonthlyCost).toBeGreaterThanOrEqual(0);

    // MongoDB Atlas
    const mongodb = calculateMongoDBCosts({
      clusterType: "dedicated",
      flexOpsPerSec: 0,
      dedicatedTier: "M30",
      storageGB: 100,
      replicaCount: 3,
    });
    expect(mongodb.totalMonthlyCost).toBeGreaterThanOrEqual(0);

    // MongoDB Self-Hosted
    const mongodbSH = calculateMongoDBSelfHostedCosts({
      instanceType: "m5.large",
      replicaCount: 3,
      storageGB: 100,
      storageType: "gp3",
      dataTransferGB: 50,
      includeConfigServers: 0,
      mongosCount: 0,
    });
    expect(mongodbSH.totalMonthlyCost).toBeGreaterThanOrEqual(0);

    // Milvus
    const milvus = calculateMilvusCosts({
      instanceType: "m5.large",
      instanceCount: 3,
      storageGB: 100,
      storageType: "gp3",
      dataTransferGB: 50,
      includeEtcd: 1,
      includeMinio: 0,
    });
    expect(milvus.totalMonthlyCost).toBeGreaterThanOrEqual(0);
  });
});
