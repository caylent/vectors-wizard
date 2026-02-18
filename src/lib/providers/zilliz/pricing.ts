// Zilliz Cloud Serverless pricing constants
// Source: https://zilliz.com/pricing

export { formatBytes, formatNumber, formatCurrency } from "@/lib/format";

export const PRICING = {
  vcu: {
    perMillion: 4,
    label: "vCU (Compute)",
    unit: "$/million vCUs",
  },
  storage: {
    perGBMonth: 0.04,
    label: "Storage",
    unit: "$/GB-month",
  },
  freeTier: {
    storageGB: 5,
    vcuMillions: 2.5,
  },
} as const;

export interface CostInputs {
  numVectors: number;
  dimensions: number;
  metadataBytes: number;
  monthlyQueries: number;
  monthlyWrites: number;
  includeFreeTier: number; // 0 = no, 1 = yes
}

export interface CostBreakdown {
  storage: {
    totalBytes: number;
    totalGB: number;
    freeGB: number;
    billableGB: number;
    monthlyCost: number;
  };
  compute: {
    queryVCUs: number;
    writeVCUs: number;
    totalVCUs: number;
    freeVCUs: number;
    billableVCUs: number;
    monthlyCost: number;
  };
  totalMonthlyCost: number;
}

// Estimate vCU consumption based on operations
// These are rough estimates - actual vCU consumption varies by query complexity
function estimateQueryVCUs(queries: number): number {
  // Assume ~1 vCU per query on average
  return queries;
}

function estimateWriteVCUs(writes: number): number {
  // Writes typically consume ~2 vCUs per operation
  return writes * 2;
}

export function calculateCosts(inputs: CostInputs): CostBreakdown {
  // Clamp all numeric inputs to non-negative to avoid nonsensical results
  const safe = {
    numVectors: Math.max(0, inputs.numVectors || 0),
    dimensions: Math.max(0, inputs.dimensions || 0),
    metadataBytes: Math.max(0, inputs.metadataBytes || 0),
    monthlyQueries: Math.max(0, inputs.monthlyQueries || 0),
    monthlyWrites: Math.max(0, inputs.monthlyWrites || 0),
    includeFreeTier: inputs.includeFreeTier,
  };

  // Storage: vectors × (dimensions × 4 bytes + metadata)
  const vectorBytes = safe.numVectors * safe.dimensions * 4;
  const metadataTotal = safe.numVectors * safe.metadataBytes;
  const storageTotalBytes = vectorBytes + metadataTotal;
  const storageTotalGB = storageTotalBytes / (1024 ** 3);

  // Apply free tier
  const includeFreeTier = safe.includeFreeTier === 1;
  const freeStorageGB = includeFreeTier ? PRICING.freeTier.storageGB : 0;
  const billableStorageGB = Math.max(0, storageTotalGB - freeStorageGB);
  const storageMonthlyCost = billableStorageGB * PRICING.storage.perGBMonth;

  // Compute (vCUs)
  const queryVCUs = estimateQueryVCUs(safe.monthlyQueries);
  const writeVCUs = estimateWriteVCUs(safe.monthlyWrites);
  const totalVCUs = queryVCUs + writeVCUs;

  const freeVCUs = includeFreeTier ? PRICING.freeTier.vcuMillions * 1_000_000 : 0;
  const billableVCUs = Math.max(0, totalVCUs - freeVCUs);
  const computeMonthlyCost = (billableVCUs / 1_000_000) * PRICING.vcu.perMillion;

  return {
    storage: {
      totalBytes: storageTotalBytes,
      totalGB: storageTotalGB,
      freeGB: freeStorageGB,
      billableGB: billableStorageGB,
      monthlyCost: storageMonthlyCost,
    },
    compute: {
      queryVCUs,
      writeVCUs,
      totalVCUs,
      freeVCUs,
      billableVCUs,
      monthlyCost: computeMonthlyCost,
    },
    totalMonthlyCost: storageMonthlyCost + computeMonthlyCost,
  };
}

