// Pinecone Serverless pricing constants (Standard Plan)
// Source: https://www.pinecone.io/pricing/

export { formatBytes, formatNumber, formatCurrency } from "@/lib/format";

export const PRICING = {
  storage: {
    perGBMonth: 0.33,
    label: "Storage",
    unit: "$/GB-month",
  },
  readUnits: {
    perMillion: 16,
    label: "Read Units (Queries)",
    unit: "$/million queries",
  },
  writeUnits: {
    perMillion: 4,
    label: "Write Units (Upserts)",
    unit: "$/million upserts",
  },
  minimum: 50, // Standard plan minimum
} as const;

export interface CostInputs {
  numVectors: number;
  dimensions: number;
  metadataBytes: number;
  monthlyQueries: number;
  monthlyUpserts: number;
  embeddingCostPerMTokens: number;
  avgTokensPerVector: number;
  avgTokensPerQuery: number;
}

export interface CostBreakdown {
  storage: {
    totalBytes: number;
    totalGB: number;
    monthlyCost: number;
  };
  reads: {
    totalQueries: number;
    monthlyCost: number;
  };
  writes: {
    totalUpserts: number;
    monthlyCost: number;
  };
  embedding: {
    writeTokens: number;
    queryTokens: number;
    totalTokens: number;
    writeCost: number;
    queryCost: number;
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
    monthlyQueries: Math.max(0, inputs.monthlyQueries || 0),
    monthlyUpserts: Math.max(0, inputs.monthlyUpserts || 0),
    embeddingCostPerMTokens: Math.max(0, inputs.embeddingCostPerMTokens || 0),
    avgTokensPerVector: Math.max(0, inputs.avgTokensPerVector || 0),
    avgTokensPerQuery: Math.max(0, inputs.avgTokensPerQuery || 0),
  };

  // Storage: vectors × dimensions × 4 bytes (float32) + metadata overhead
  const vectorBytes = safe.numVectors * safe.dimensions * 4;
  const metadataTotal = safe.numVectors * safe.metadataBytes;
  const storageTotalBytes = vectorBytes + metadataTotal;
  const storageTotalGB = storageTotalBytes / (1024 ** 3);
  const storageMonthlyCost = storageTotalGB * PRICING.storage.perGBMonth;

  // Read units (queries)
  const readsMonthlyCost = (safe.monthlyQueries / 1_000_000) * PRICING.readUnits.perMillion;

  // Write units (upserts)
  const writesMonthlyCost = (safe.monthlyUpserts / 1_000_000) * PRICING.writeUnits.perMillion;

  // Embedding costs (optional, user's embedding model)
  const costPerToken = safe.embeddingCostPerMTokens / 1_000_000;
  const embeddingWriteTokens = safe.monthlyUpserts * safe.avgTokensPerVector;
  const embeddingQueryTokens = safe.monthlyQueries * safe.avgTokensPerQuery;
  const embeddingTotalTokens = embeddingWriteTokens + embeddingQueryTokens;
  const embeddingWriteCost = embeddingWriteTokens * costPerToken;
  const embeddingQueryCost = embeddingQueryTokens * costPerToken;
  const embeddingMonthlyCost = embeddingWriteCost + embeddingQueryCost;

  const subtotal = storageMonthlyCost + readsMonthlyCost + writesMonthlyCost + embeddingMonthlyCost;
  const totalMonthlyCost = Math.max(PRICING.minimum, subtotal);

  return {
    storage: {
      totalBytes: storageTotalBytes,
      totalGB: storageTotalGB,
      monthlyCost: storageMonthlyCost,
    },
    reads: {
      totalQueries: safe.monthlyQueries,
      monthlyCost: readsMonthlyCost,
    },
    writes: {
      totalUpserts: safe.monthlyUpserts,
      monthlyCost: writesMonthlyCost,
    },
    embedding: {
      writeTokens: embeddingWriteTokens,
      queryTokens: embeddingQueryTokens,
      totalTokens: embeddingTotalTokens,
      writeCost: embeddingWriteCost,
      queryCost: embeddingQueryCost,
      monthlyCost: embeddingMonthlyCost,
    },
    subtotal,
    minimum: PRICING.minimum,
    totalMonthlyCost,
  };
}

