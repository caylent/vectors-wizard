// Amazon OpenSearch Serverless pricing constants (US East)
// Source: https://aws.amazon.com/opensearch-service/pricing/

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
  // Estimate OCUs based on workload
  const searchOCUs = Math.min(
    inputs.maxSearchOCUs,
    estimateSearchOCUs(inputs.monthlyQueries, inputs.deploymentMode)
  );
  const indexingOCUs = Math.min(
    inputs.maxIndexingOCUs,
    estimateIndexingOCUs(inputs.monthlyWrites, inputs.deploymentMode)
  );

  const totalOCUs = searchOCUs + indexingOCUs;
  const computeMonthlyCost = totalOCUs * PRICING.ocu.perHour * PRICING.hoursPerMonth;

  // Storage
  const storageMonthlyCost = inputs.indexSizeGB * PRICING.storage.perGBMonth;

  return {
    compute: {
      indexingOCUs,
      searchOCUs,
      totalOCUs,
      monthlyCost: computeMonthlyCost,
    },
    storage: {
      totalGB: inputs.indexSizeGB,
      monthlyCost: storageMonthlyCost,
    },
    totalMonthlyCost: computeMonthlyCost + storageMonthlyCost,
  };
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatCurrency(n: number): string {
  if (n < 0.01 && n > 0) return `< $0.01`;
  if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(2)}`;
}
