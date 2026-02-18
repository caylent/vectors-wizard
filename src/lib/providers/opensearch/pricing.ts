// Amazon OpenSearch Serverless pricing constants (US East)
// Source: https://aws.amazon.com/opensearch-service/pricing/

export { formatBytes, formatNumber, formatCurrency } from "@/lib/format";

export const PRICING = {
  ocu: {
    perHour: 0.24,
    label: "OCU (Compute)",
    unit: "$/OCU-hour",
  },
  storage: {
    perGBMonth: 0.024,
    label: "Storage (S3)",
    unit: "$/GB-month",
  },
  hoursPerMonth: 730,
  minimumOCUs: {
    production: 2, // 1 indexing + 1 search (with replicas)
    devTest: 1,    // 0.5 indexing + 0.5 search
  },
} as const;

export interface CostInputs {
  indexSizeGB: number;
  deploymentMode: "production" | "dev-test";
  monthlyQueries: number;
  monthlyWrites: number;
  maxSearchOCUs: number;
  maxIndexingOCUs: number;
}

export interface CostBreakdown {
  compute: {
    indexingOCUs: number;
    searchOCUs: number;
    totalOCUs: number;
    monthlyCost: number;
  };
  storage: {
    totalGB: number;
    monthlyCost: number;
  };
  totalMonthlyCost: number;
}

// Estimate OCUs needed based on workload
// These are rough estimates - actual OCU consumption depends on query complexity
function estimateSearchOCUs(queries: number, mode: "production" | "dev-test"): number {
  const baseOCUs = mode === "production" ? 1 : 0.5;
  // Rough estimate: 1 OCU can handle ~100 QPS sustained
  const qps = queries / (30 * 24 * 3600);
  const estimatedOCUs = Math.max(baseOCUs, qps / 100);
  return Math.ceil(estimatedOCUs * 2) / 2; // Round to 0.5
}

function estimateIndexingOCUs(writes: number, mode: "production" | "dev-test"): number {
  const baseOCUs = mode === "production" ? 1 : 0.5;
  // Rough estimate: 1 OCU can handle ~500 writes/sec sustained
  const wps = writes / (30 * 24 * 3600);
  const estimatedOCUs = Math.max(baseOCUs, wps / 500);
  return Math.ceil(estimatedOCUs * 2) / 2; // Round to 0.5
}

export function calculateCosts(inputs: CostInputs): CostBreakdown {
  // Clamp all numeric inputs to non-negative to avoid nonsensical results
  const safe = {
    indexSizeGB: Math.max(0, inputs.indexSizeGB || 0),
    monthlyQueries: Math.max(0, inputs.monthlyQueries || 0),
    monthlyWrites: Math.max(0, inputs.monthlyWrites || 0),
    maxSearchOCUs: Math.max(0, inputs.maxSearchOCUs || 0),
    maxIndexingOCUs: Math.max(0, inputs.maxIndexingOCUs || 0),
  };

  // Estimate OCUs based on workload
  const searchOCUs = Math.min(
    safe.maxSearchOCUs,
    estimateSearchOCUs(safe.monthlyQueries, inputs.deploymentMode)
  );
  const indexingOCUs = Math.min(
    safe.maxIndexingOCUs,
    estimateIndexingOCUs(safe.monthlyWrites, inputs.deploymentMode)
  );

  const totalOCUs = searchOCUs + indexingOCUs;
  const computeMonthlyCost = totalOCUs * PRICING.ocu.perHour * PRICING.hoursPerMonth;

  // Storage
  const storageMonthlyCost = safe.indexSizeGB * PRICING.storage.perGBMonth;

  return {
    compute: {
      indexingOCUs,
      searchOCUs,
      totalOCUs,
      monthlyCost: computeMonthlyCost,
    },
    storage: {
      totalGB: safe.indexSizeGB,
      monthlyCost: storageMonthlyCost,
    },
    totalMonthlyCost: computeMonthlyCost + storageMonthlyCost,
  };
}

