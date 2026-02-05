// Weaviate Cloud pricing constants (Flex Plan)
// Source: https://weaviate.io/pricing

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
  // Dimensions: objects × dimensions × replication factor
  const totalDimensions = inputs.numObjects * inputs.dimensions * inputs.replicationFactor;
  const dimensionsCost = (totalDimensions / 1_000_000) * PRICING.dimensions.perMillion;

  // Storage
  const storageCost = inputs.storageGiB * PRICING.storage.perGiB;

  // Backup
  const backupCost = inputs.backupGiB * PRICING.backup.perGiB;

  const subtotal = dimensionsCost + storageCost + backupCost;
  const totalMonthlyCost = Math.max(PRICING.minimum, subtotal);

  return {
    dimensions: {
      totalDimensions,
      monthlyCost: dimensionsCost,
    },
    storage: {
      totalGiB: inputs.storageGiB,
      monthlyCost: storageCost,
    },
    backup: {
      totalGiB: inputs.backupGiB,
      monthlyCost: backupCost,
    },
    subtotal,
    minimum: PRICING.minimum,
    totalMonthlyCost,
  };
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}T`;
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

// Estimate storage based on vectors
export function estimateStorageGiB(numObjects: number, dimensions: number, metadataBytes: number): number {
  const vectorBytes = numObjects * dimensions * 4; // float32
  const metadataTotal = numObjects * metadataBytes;
  const indexOverhead = 1.5; // HNSW index overhead
  const totalBytes = (vectorBytes + metadataTotal) * indexOverhead;
  return totalBytes / (1024 ** 3);
}
