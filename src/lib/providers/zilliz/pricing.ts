// Zilliz Cloud Serverless pricing constants
// Source: https://zilliz.com/pricing

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
  // Storage: vectors × (dimensions × 4 bytes + metadata)
  const vectorBytes = inputs.numVectors * inputs.dimensions * 4;
  const metadataTotal = inputs.numVectors * inputs.metadataBytes;
  const storageTotalBytes = vectorBytes + metadataTotal;
  const storageTotalGB = storageTotalBytes / (1024 ** 3);

  // Apply free tier
  const includeFreeTier = inputs.includeFreeTier === 1;
  const freeStorageGB = includeFreeTier ? PRICING.freeTier.storageGB : 0;
  const billableStorageGB = Math.max(0, storageTotalGB - freeStorageGB);
  const storageMonthlyCost = billableStorageGB * PRICING.storage.perGBMonth;

  // Compute (vCUs)
  const queryVCUs = estimateQueryVCUs(inputs.monthlyQueries);
  const writeVCUs = estimateWriteVCUs(inputs.monthlyWrites);
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

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val < 10 ? 2 : 1)} ${units[i]}`;
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
