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
  // Storage: vectors × dimensions × 4 bytes (float32) + metadata overhead
  const vectorBytes = inputs.numVectors * inputs.dimensions * 4;
  const metadataTotal = inputs.numVectors * inputs.metadataBytes;
  const storageTotalBytes = vectorBytes + metadataTotal;
  const storageTotalGB = storageTotalBytes / (1024 ** 3);
  const storageMonthlyCost = storageTotalGB * PRICING.storage.perGBMonth;

  // Read units (queries)
  const readsMonthlyCost = (inputs.monthlyQueries / 1_000_000) * PRICING.readUnits.perMillion;

  // Write units (upserts)
  const writesMonthlyCost = (inputs.monthlyUpserts / 1_000_000) * PRICING.writeUnits.perMillion;

  // Embedding costs (optional, user's embedding model)
  const costPerToken = inputs.embeddingCostPerMTokens / 1_000_000;
  const embeddingWriteTokens = inputs.monthlyUpserts * inputs.avgTokensPerVector;
  const embeddingQueryTokens = inputs.monthlyQueries * inputs.avgTokensPerQuery;
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
      totalQueries: inputs.monthlyQueries,
      monthlyCost: readsMonthlyCost,
    },
    writes: {
      totalUpserts: inputs.monthlyUpserts,
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

