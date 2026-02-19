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
    it('should calculate compute cost from configured OCUs', () => {
      const result = calculateCosts(baseConfig);

      // 2 search + 2 indexing = 4 OCUs * $0.24/hour * 730 hours = $700.80
      expect(result.compute.searchOCUs).toBe(2);
      expect(result.compute.indexingOCUs).toBe(2);
      expect(result.compute.totalOCUs).toBe(4);
      expect(result.compute.monthlyCost).toBeCloseTo(4 * 0.24 * 730, 0);
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
        maxSearchOCUs: 0.5,
        maxIndexingOCUs: 0.5,
      };

      const prodResult = calculateCosts(baseConfig);
      const devResult = calculateCosts(devConfig);

      expect(devResult.compute.monthlyCost).toBeLessThan(
        prodResult.compute.monthlyCost
      );
    });

    it('should enforce production minimums (1 OCU each)', () => {
      const result = calculateCosts({
        ...baseConfig,
        maxSearchOCUs: 0.5,
        maxIndexingOCUs: 0.5,
      });

      // Production minimum: 1 search + 1 indexing
      expect(result.compute.searchOCUs).toBe(1);
      expect(result.compute.indexingOCUs).toBe(1);
    });

    it('should enforce dev-test minimums (0.5 OCU each)', () => {
      const result = calculateCosts({
        ...baseConfig,
        deploymentMode: 'dev-test',
        maxSearchOCUs: 0,
        maxIndexingOCUs: 0,
      });

      expect(result.compute.searchOCUs).toBe(0.5);
      expect(result.compute.indexingOCUs).toBe(0.5);
    });

    it('should cost ~$1400 for 8 OCUs', () => {
      const result = calculateCosts({
        ...baseConfig,
        maxSearchOCUs: 4,
        maxIndexingOCUs: 4,
      });

      // 8 OCUs * $0.24/hour * 730 hours = $1,401.60
      expect(result.compute.totalOCUs).toBe(8);
      expect(result.compute.monthlyCost).toBeCloseTo(1401.6, 0);
    });

    it('should have minimum costs around $175 for dev-test', () => {
      const devConfig: CostInputs = {
        indexSizeGB: 1,
        deploymentMode: 'dev-test',
        monthlyQueries: 1000,
        monthlyWrites: 1000,
        maxSearchOCUs: 0.5,
        maxIndexingOCUs: 0.5,
      };

      const result = calculateCosts(devConfig);
      // 1 OCU * $0.24 * 730 = ~$175
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
