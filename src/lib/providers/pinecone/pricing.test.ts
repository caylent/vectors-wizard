import { describe, it, expect } from 'vitest';
import { calculateCosts, PRICING, type CostInputs } from './pricing';

describe('pinecone/pricing', () => {
  const baseConfig: CostInputs = {
    numVectors: 100000,
    dimensions: 1536,
    metadataBytes: 200,
    monthlyQueries: 500000,
    monthlyUpserts: 10000,
    embeddingCostPerMTokens: 0,
    avgTokensPerVector: 0,
    avgTokensPerQuery: 0,
  };

  describe('calculateCosts', () => {
    it('should calculate storage cost based on vectors and dimensions', () => {
      const result = calculateCosts(baseConfig);

      // 100K vectors * 1536 dims * 4 bytes = ~614 MB
      // Plus metadata: 100K * 200 bytes = 20 MB
      // Total ~634 MB = 0.62 GB
      // Cost: 0.62 GB * $0.33 = ~$0.20
      expect(result.storage.monthlyCost).toBeGreaterThan(0);
      expect(result.storage.monthlyCost).toBeLessThan(1); // Should be small for 100K vectors
    });

    it('should calculate read costs for queries', () => {
      const result = calculateCosts(baseConfig);

      // 500K queries / 1M * $16 = $8
      expect(result.reads.monthlyCost).toBe(8);
    });

    it('should calculate write costs for upserts', () => {
      const result = calculateCosts(baseConfig);

      // 10K upserts / 1M * $4 = $0.04
      expect(result.writes.monthlyCost).toBeCloseTo(0.04, 2);
    });

    it('should enforce minimum of $50', () => {
      const smallConfig: CostInputs = {
        ...baseConfig,
        numVectors: 1000,
        monthlyQueries: 1000,
        monthlyUpserts: 100,
      };

      const result = calculateCosts(smallConfig);
      expect(result.totalMonthlyCost).toBe(PRICING.minimum);
    });

    it('should exceed minimum for high usage', () => {
      const highUsageConfig: CostInputs = {
        ...baseConfig,
        numVectors: 10000000,
        monthlyQueries: 10000000,
        monthlyUpserts: 1000000,
      };

      const result = calculateCosts(highUsageConfig);
      expect(result.totalMonthlyCost).toBeGreaterThan(PRICING.minimum);
    });

    it('should include embedding costs when provided', () => {
      // Use high usage config so we exceed the $50 minimum
      const highUsageBase: CostInputs = {
        numVectors: 1000000,
        dimensions: 1536,
        metadataBytes: 200,
        monthlyQueries: 5000000,
        monthlyUpserts: 100000,
        embeddingCostPerMTokens: 0,
        avgTokensPerVector: 0,
        avgTokensPerQuery: 0,
      };

      const withEmbeddings: CostInputs = {
        ...highUsageBase,
        embeddingCostPerMTokens: 0.02,
        avgTokensPerVector: 256,
        avgTokensPerQuery: 25,
      };

      const withoutEmbeddings = calculateCosts(highUsageBase);
      const withEmbeddingsResult = calculateCosts(withEmbeddings);

      expect(withEmbeddingsResult.embedding.monthlyCost).toBeGreaterThan(0);
      // Both should exceed minimum, so embedding costs should add to total
      expect(withEmbeddingsResult.totalMonthlyCost).toBeGreaterThan(
        withoutEmbeddings.totalMonthlyCost
      );
    });

    it('should scale linearly with vector count for storage', () => {
      const config1x = calculateCosts({ ...baseConfig, numVectors: 100000 });
      const config2x = calculateCosts({ ...baseConfig, numVectors: 200000 });

      // Storage should roughly double
      expect(config2x.storage.monthlyCost).toBeCloseTo(
        config1x.storage.monthlyCost * 2,
        1
      );
    });

    it('should scale with dimensions for storage', () => {
      const config768 = calculateCosts({ ...baseConfig, dimensions: 768 });
      const config1536 = calculateCosts({ ...baseConfig, dimensions: 1536 });

      // 1536 dims should cost roughly 2x 768 dims
      expect(config1536.storage.monthlyCost).toBeGreaterThan(
        config768.storage.monthlyCost * 1.8
      );
    });
  });

  describe('PRICING constants', () => {
    it('should have expected rates', () => {
      expect(PRICING.storage.perGBMonth).toBe(0.33);
      expect(PRICING.readUnits.perMillion).toBe(16);
      expect(PRICING.writeUnits.perMillion).toBe(4);
      expect(PRICING.minimum).toBe(50);
    });
  });
});
