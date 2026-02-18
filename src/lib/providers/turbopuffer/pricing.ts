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
  // Clamp all numeric inputs to non-negative to avoid nonsensical results
  const safe = {
    numVectors: Math.max(0, inputs.numVectors || 0),
    dimensions: Math.max(0, inputs.dimensions || 0),
    metadataBytes: Math.max(0, inputs.metadataBytes || 0),
    monthlyWriteGB: Math.max(0, inputs.monthlyWriteGB || 0),
    monthlyQueryGB: Math.max(0, inputs.monthlyQueryGB || 0),
  };

  // Storage: logical bytes stored
  const vectorBytes = safe.numVectors * safe.dimensions * 4; // float32
  const metadataTotal = safe.numVectors * safe.metadataBytes;
  const storageTotalBytes = vectorBytes + metadataTotal;
  const storageTotalTB = storageTotalBytes / (1024 ** 4);
  const storageCost = storageTotalTB * PRICING.storage.perTBMonth;

  // Writes: average of no discount and max batch discount
  const writeDiscountFactor = 1 - PRICING.writes.batchDiscount / 2;
  const effectiveWriteRate = PRICING.writes.basePerGB * writeDiscountFactor;
  const writesCost = safe.monthlyWriteGB * effectiveWriteRate;

  // Queries: average of no discount and max volume discount
  const queryDiscountFactor = 1 - PRICING.queries.volumeDiscount / 2;
  const effectiveQueryRate = PRICING.queries.basePerGB * queryDiscountFactor;
  const queriesCost = safe.monthlyQueryGB * effectiveQueryRate;

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
      totalGB: safe.monthlyWriteGB,
      monthlyCost: writesCost,
    },
    queries: {
      totalGB: safe.monthlyQueryGB,
      monthlyCost: queriesCost,
    },
    subtotal,
    minimum: planMinimum,
    totalMonthlyCost,
  };
}

