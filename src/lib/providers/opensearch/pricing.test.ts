import { describe, it, expect } from 'vitest';
import { calculateCosts, PRICING, type CostInputs } from './pricing';

describe('opensearch/pricing', () => {
  const baseConfig: CostInputs = {
    indexSizeGB: 10,
    deploymentMode: 'production',
    monthlyQueries: 1000000,
    monthlyWrites: 100000,
    maxSearchOCUs: 2,
    maxIndexingOCUs: 2,
  };

  describe('calculateCosts', () => {
    it('should calculate compute cost based on OCUs', () => {
      const result = calculateCosts(baseConfig);

      // At minimum, production uses 2 OCUs (1 search + 1 indexing)
      // 2 OCUs * $0.24/hour * 730 hours = ~$350
      expect(result.compute.monthlyCost).toBeGreaterThanOrEqual(350);
    });

    it('should calculate storage cost', () => {
      const result = calculateCosts(baseConfig);

      // 10 GB * $0.024 = $0.24
      expect(result.storage.monthlyCost).toBeCloseTo(0.24, 2);
    });

    it('should use fewer OCUs in dev-test mode', () => {
      const devConfig: CostInputs = {
        ...baseConfig,
        deploymentMode: 'dev-test',
      };

      const prodResult = calculateCosts(baseConfig);
      const devResult = calculateCosts(devConfig);

      // Dev/test should have lower compute costs
      expect(devResult.compute.monthlyCost).toBeLessThan(
        prodResult.compute.monthlyCost
      );
    });

    it('should scale OCUs with query volume', () => {
      const lowQueries = calculateCosts({
        ...baseConfig,
        monthlyQueries: 100000,
        maxSearchOCUs: 10,
      });

      const highQueries = calculateCosts({
        ...baseConfig,
        monthlyQueries: 100000000,
        maxSearchOCUs: 10,
      });

      // High queries should use more search OCUs
      expect(highQueries.compute.searchOCUs).toBeGreaterThanOrEqual(
        lowQueries.compute.searchOCUs
      );
    });

    it('should respect max OCU limits', () => {
      const result = calculateCosts({
        ...baseConfig,
        monthlyQueries: 1000000000, // Very high
        maxSearchOCUs: 3,
        maxIndexingOCUs: 2,
      });

      expect(result.compute.searchOCUs).toBeLessThanOrEqual(3);
      expect(result.compute.indexingOCUs).toBeLessThanOrEqual(2);
    });

    it('should have minimum costs around $175 for dev-test', () => {
      const devConfig: CostInputs = {
        indexSizeGB: 1,
        deploymentMode: 'dev-test',
        monthlyQueries: 1000,
        monthlyWrites: 1000,
        maxSearchOCUs: 1,
        maxIndexingOCUs: 1,
      };

      const result = calculateCosts(devConfig);
      // ~1 OCU * $0.24 * 730 = ~$175
      expect(result.totalMonthlyCost).toBeGreaterThan(150);
      expect(result.totalMonthlyCost).toBeLessThan(200);
    });
  });

  describe('PRICING constants', () => {
    it('should have expected rates', () => {
      expect(PRICING.ocu.perHour).toBe(0.24);
      expect(PRICING.storage.perGBMonth).toBe(0.024);
      expect(PRICING.hoursPerMonth).toBe(730);
    });
  });
});
