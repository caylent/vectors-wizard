// TurboPuffer pricing constants (Launch Plan)
// Source: https://turbopuffer.com/pricing

export { formatBytes, formatNumber, formatCurrency } from "@/lib/format";

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

  // Writes: average of no discount and max batch discount
  const writeDiscountFactor = 1 - PRICING.writes.batchDiscount / 2;
  const effectiveWriteRate = PRICING.writes.basePerGB * writeDiscountFactor;
  const writesCost = inputs.monthlyWriteGB * effectiveWriteRate;

  // Queries: average of no discount and max volume discount
  const queryDiscountFactor = 1 - PRICING.queries.volumeDiscount / 2;
  const effectiveQueryRate = PRICING.queries.basePerGB * queryDiscountFactor;
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

