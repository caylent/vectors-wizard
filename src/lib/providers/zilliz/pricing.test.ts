import { describe, it, expect } from 'vitest';
import { calculateCosts, PRICING, type CostInputs } from './pricing';

describe('zilliz/pricing', () => {
  const baseConfig: CostInputs = {
    numVectors: 100000,
    dimensions: 1536,
    metadataBytes: 200,
    monthlyQueries: 1000000,
    monthlyWrites: 100000,
    includeFreeTier: 0,
  };

  describe('calculateCosts', () => {
    it('should calculate storage cost', () => {
      const result = calculateCosts(baseConfig);

      // 100K vectors * 1536 dims * 4 bytes = ~614 MB
      // Plus metadata: 100K * 200 bytes = 20 MB
      // Total ~0.62 GB * $0.04 = ~$0.025
      expect(result.storage.monthlyCost).toBeGreaterThan(0);
      expect(result.storage.monthlyCost).toBeLessThan(0.1);
    });

    it('should calculate compute cost based on vCUs', () => {
      const result = calculateCosts(baseConfig);

      // Query vCUs: ~1M queries * 1 vCU/query = 1M vCUs
      // Write vCUs: ~100K writes * 2 vCU/write = 200K vCUs
      // Total: 1.2M vCUs / 1M * $4 = ~$4.8
      expect(result.compute.monthlyCost).toBeGreaterThan(0);
    });

    it('should apply free tier when enabled', () => {
      const withFreeTier = calculateCosts({
        ...baseConfig,
        includeFreeTier: 1,
      });

      const withoutFreeTier = calculateCosts({
        ...baseConfig,
        includeFreeTier: 0,
      });

      // Free tier should reduce costs
      expect(withFreeTier.totalMonthlyCost).toBeLessThanOrEqual(
        withoutFreeTier.totalMonthlyCost
      );
    });

    it('should have zero cost within free tier limits', () => {
      const smallConfig: CostInputs = {
        numVectors: 10000,
        dimensions: 768,
        metadataBytes: 100,
        monthlyQueries: 100000,
        monthlyWrites: 10000,
        includeFreeTier: 1,
      };

      const result = calculateCosts(smallConfig);

      // Small usage should be covered by free tier (5GB + 2.5M vCUs)
      expect(result.totalMonthlyCost).toBe(0);
    });

    it('should scale linearly with vector count', () => {
      const config1x = calculateCosts({ ...baseConfig, numVectors: 100000 });
      const config10x = calculateCosts({ ...baseConfig, numVectors: 1000000 });

      // Storage should scale ~10x
      expect(config10x.storage.monthlyCost).toBeCloseTo(
        config1x.storage.monthlyCost * 10,
        1
      );
    });

    it('should track free tier usage correctly', () => {
      const result = calculateCosts({
        ...baseConfig,
        includeFreeTier: 1,
      });

      expect(result.storage.freeGB).toBe(PRICING.freeTier.storageGB);
      expect(result.compute.freeVCUs).toBe(PRICING.freeTier.vcuMillions * 1000000);
    });
  });

  describe('PRICING constants', () => {
    it('should have expected rates', () => {
      expect(PRICING.vcu.perMillion).toBe(4);
      expect(PRICING.storage.perGBMonth).toBe(0.04);
      expect(PRICING.freeTier.storageGB).toBe(5);
      expect(PRICING.freeTier.vcuMillions).toBe(2.5);
    });
  });
});
