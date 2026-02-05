// TurboPuffer pricing constants (Launch Plan)
// Source: https://turbopuffer.com/pricing

export const PRICING = {
  storage: {
    perTBMonth: 70,
    label: "Storage",
    unit: "$/TB-month",
  },
  writes: {
    basePerGB: 0.10, // Approximate base rate
    batchDiscount: 0.5, // Up to 50% discount for batches
    label: "Writes",
    unit: "$/GB written",
  },
  queries: {
    basePerGB: 0.05, // Approximate base rate
    volumeDiscount: 0.8, // 80% discount beyond 32GB per query
    label: "Queries",
    unit: "$/GB queried",
  },
  minimum: {
    launch: 64,
    scale: 256,
    enterprise: 4096,
  },
} as const;

export interface CostInputs {
  numVectors: number;
  dimensions: number;
  metadataBytes: number;
  monthlyWriteGB: number;
  monthlyQueryGB: number;
  plan: "launch" | "scale" | "enterprise";
}

export interface CostBreakdown {
  storage: {
    totalBytes: number;
    totalTB: number;
    monthlyCost: number;
  };
  writes: {
    totalGB: number;
    monthlyCost: number;
  };
  queries: {
    totalGB: number;
    monthlyCost: number;
  };
  subtotal: number;
  minimum: number;
  totalMonthlyCost: number;
}

export function calculateCosts(inputs: CostInputs): CostBreakdown {
  // Storage: logical bytes stored
  const vectorBytes = inputs.numVectors * inputs.dimensions * 4; // float32
  const metadataTotal = inputs.numVectors * inputs.metadataBytes;
  const storageTotalBytes = vectorBytes + metadataTotal;
  const storageTotalTB = storageTotalBytes / (1024 ** 4);
  const storageCost = storageTotalTB * PRICING.storage.perTBMonth;

  // Writes (with batch discount estimate - assume 25% discount on average)
  const effectiveWriteRate = PRICING.writes.basePerGB * 0.75;
  const writesCost = inputs.monthlyWriteGB * effectiveWriteRate;

  // Queries (with volume discount estimate)
  const effectiveQueryRate = PRICING.queries.basePerGB * 0.6; // Average discount
  const queriesCost = inputs.monthlyQueryGB * effectiveQueryRate;

  const subtotal = storageCost + writesCost + queriesCost;
  const planMinimum = PRICING.minimum[inputs.plan];
  const totalMonthlyCost = Math.max(planMinimum, subtotal);

  return {
    storage: {
      totalBytes: storageTotalBytes,
      totalTB: storageTotalTB,
      monthlyCost: storageCost,
    },
    writes: {
      totalGB: inputs.monthlyWriteGB,
      monthlyCost: writesCost,
    },
    queries: {
      totalGB: inputs.monthlyQueryGB,
      monthlyCost: queriesCost,
    },
    subtotal,
    minimum: planMinimum,
    totalMonthlyCost,
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
