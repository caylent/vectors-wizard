// Weaviate Cloud pricing constants (Flex Plan)
// Source: https://weaviate.io/pricing

export { formatBytes, formatNumber, formatCurrency } from "@/lib/format";

export const PRICING = {
  dimensions: {
    perMillion: 0.0139,
    label: "Vector Dimensions",
    unit: "$/million dimensions",
  },
  storage: {
    perGiB: 0.255,
    label: "Storage",
    unit: "$/GiB-month",
  },
  backup: {
    perGiB: 0.0264,
    label: "Backup Storage",
    unit: "$/GiB-month",
  },
  minimum: 45, // Flex plan minimum
} as const;

export interface CostInputs {
  numObjects: number;
  dimensions: number;
  replicationFactor: number;
  storageGiB: number;
  backupGiB: number;
}

export interface CostBreakdown {
  dimensions: {
    totalDimensions: number;
    monthlyCost: number;
  };
  storage: {
    totalGiB: number;
    monthlyCost: number;
  };
  backup: {
    totalGiB: number;
    monthlyCost: number;
  };
  subtotal: number;
  minimum: number;
  totalMonthlyCost: number;
}

export function calculateCosts(inputs: CostInputs): CostBreakdown {
  // Clamp all numeric inputs to non-negative to avoid nonsensical results
  const safe = {
    numObjects: Math.max(0, inputs.numObjects || 0),
    dimensions: Math.max(0, inputs.dimensions || 0),
    replicationFactor: Math.max(0, inputs.replicationFactor || 0),
    storageGiB: Math.max(0, inputs.storageGiB || 0),
    backupGiB: Math.max(0, inputs.backupGiB || 0),
  };

  // Dimensions: objects × dimensions × replication factor
  const totalDimensions = safe.numObjects * safe.dimensions * safe.replicationFactor;
  const dimensionsCost = (totalDimensions / 1_000_000) * PRICING.dimensions.perMillion;

  // Storage
  const storageCost = safe.storageGiB * PRICING.storage.perGiB;

  // Backup
  const backupCost = safe.backupGiB * PRICING.backup.perGiB;

  const subtotal = dimensionsCost + storageCost + backupCost;
  const totalMonthlyCost = Math.max(PRICING.minimum, subtotal);

  return {
    dimensions: {
      totalDimensions,
      monthlyCost: dimensionsCost,
    },
    storage: {
      totalGiB: safe.storageGiB,
      monthlyCost: storageCost,
    },
    backup: {
      totalGiB: safe.backupGiB,
      monthlyCost: backupCost,
    },
    subtotal,
    minimum: PRICING.minimum,
    totalMonthlyCost,
  };
}


// Estimate storage based on vectors
export function estimateStorageGiB(numObjects: number, dimensions: number, metadataBytes: number): number {
  const vectorBytes = numObjects * dimensions * 4; // float32
  const metadataTotal = numObjects * metadataBytes;
  const indexOverhead = 1.5; // HNSW index overhead
  const totalBytes = (vectorBytes + metadataTotal) * indexOverhead;
  return totalBytes / (1024 ** 3);
}
