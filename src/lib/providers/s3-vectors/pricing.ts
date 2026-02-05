// S3 Vectors pricing constants (US East - N. Virginia)
// Source: https://aws.amazon.com/s3/pricing/ (S3 Vectors section)

export { formatBytes, formatNumber, formatCurrency } from "@/lib/format";

export const PRICING = {
  storage: {
    perGBMonth: 0.06,
    label: "Storage",
    unit: "$/GB-month",
  },
  write: {
    perGBUploaded: 0.20,
    label: "Write (PUT)",
    unit: "$/GB uploaded",
  },
  query: {
    perMillionCalls: 2.50,
    label: "Query API calls",
    unit: "$/million calls",
    // Data processed tiered pricing
    dataProcessed: {
      tier1: {
        upToVectors: 100_000,
        perTB: 0.004,
      },
      tier2: {
        perTB: 0.002,
      },
    },
  },
} as const;

export interface CostInputs {
  numVectors: number;
  dimensions: number;
  avgKeyLengthBytes: number;
  filterableMetadataBytes: number;
  nonFilterableMetadataBytes: number;
  monthlyQueries: number;
  monthlyVectorsWritten: number;
  embeddingCostPerMTokens: number;
  avgTokensPerVector: number;
  avgTokensPerQuery: number;
}

export interface CostBreakdown {
  storage: {
    totalBytes: number;
    totalGB: number;
    perVectorBytes: number;
    monthlyCost: number;
  };
  write: {
    totalBytes: number;
    totalGB: number;
    perVectorBytes: number;
    monthlyCost: number;
  };
  query: {
    apiCallsCost: number;
    dataProcessedBytes: number;
    dataProcessedTB: number;
    dataProcessedCost: number;
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
  totalMonthlyCost: number;
}

export function calculateCosts(inputs: CostInputs): CostBreakdown {
  // Clamp all numeric inputs to non-negative to avoid nonsensical results
  const safe = {
    numVectors: Math.max(0, inputs.numVectors || 0),
    dimensions: Math.max(0, inputs.dimensions || 0),
    avgKeyLengthBytes: Math.max(0, inputs.avgKeyLengthBytes || 0),
    filterableMetadataBytes: Math.max(0, inputs.filterableMetadataBytes || 0),
    nonFilterableMetadataBytes: Math.max(0, inputs.nonFilterableMetadataBytes || 0),
    monthlyQueries: Math.max(0, inputs.monthlyQueries || 0),
    monthlyVectorsWritten: Math.max(0, inputs.monthlyVectorsWritten || 0),
    embeddingCostPerMTokens: Math.max(0, inputs.embeddingCostPerMTokens || 0),
    avgTokensPerVector: Math.max(0, inputs.avgTokensPerVector || 0),
    avgTokensPerQuery: Math.max(0, inputs.avgTokensPerQuery || 0),
  };

  const vectorDataBytes = 4 * safe.dimensions; // float32
  const totalPerVectorBytes =
    vectorDataBytes +
    safe.avgKeyLengthBytes +
    safe.filterableMetadataBytes +
    safe.nonFilterableMetadataBytes;

  // Storage
  const storageTotalBytes = totalPerVectorBytes * safe.numVectors;
  const storageTotalGB = storageTotalBytes / (1024 ** 3);
  const storageMonthlyCost = storageTotalGB * PRICING.storage.perGBMonth;

  // Write
  const writeTotalBytes = totalPerVectorBytes * safe.monthlyVectorsWritten;
  const writeTotalGB = writeTotalBytes / (1024 ** 3);
  const writeMonthlyCost = writeTotalGB * PRICING.write.perGBUploaded;

  // Query
  const queryApiCost =
    (safe.monthlyQueries / 1_000_000) * PRICING.query.perMillionCalls;

  // Data processed: excludes non-filterable metadata
  const queryVectorSizeBytes =
    vectorDataBytes + safe.avgKeyLengthBytes + safe.filterableMetadataBytes;

  // Total data processed = per-query-scan-size * num_queries
  // per-query-scan-size = avg_vector_size * num_vectors_in_index
  const perQueryScanBytes = queryVectorSizeBytes * safe.numVectors;
  const totalDataProcessedBytes = perQueryScanBytes * safe.monthlyQueries;
  const totalDataProcessedTB = totalDataProcessedBytes / (1024 ** 4);

  // Tiered pricing for data processed
  let dataProcessedCost: number;
  if (safe.numVectors <= PRICING.query.dataProcessed.tier1.upToVectors) {
    dataProcessedCost =
      totalDataProcessedTB * PRICING.query.dataProcessed.tier1.perTB;
  } else {
    // Blended: first 100K vectors at tier1 rate, rest at tier2
    const tier1Fraction =
      PRICING.query.dataProcessed.tier1.upToVectors / safe.numVectors;
    const tier2Fraction = 1 - tier1Fraction;
    const blendedRate =
      tier1Fraction * PRICING.query.dataProcessed.tier1.perTB +
      tier2Fraction * PRICING.query.dataProcessed.tier2.perTB;
    dataProcessedCost = totalDataProcessedTB * blendedRate;
  }

  const queryMonthlyCost = queryApiCost + dataProcessedCost;

  // Embedding
  const costPerToken = safe.embeddingCostPerMTokens / 1_000_000;
  const embeddingWriteTokens = safe.monthlyVectorsWritten * safe.avgTokensPerVector;
  const embeddingQueryTokens = safe.monthlyQueries * safe.avgTokensPerQuery;
  const embeddingTotalTokens = embeddingWriteTokens + embeddingQueryTokens;
  const embeddingWriteCost = embeddingWriteTokens * costPerToken;
  const embeddingQueryCost = embeddingQueryTokens * costPerToken;
  const embeddingMonthlyCost = embeddingWriteCost + embeddingQueryCost;

  return {
    storage: {
      totalBytes: storageTotalBytes,
      totalGB: storageTotalGB,
      perVectorBytes: totalPerVectorBytes,
      monthlyCost: storageMonthlyCost,
    },
    write: {
      totalBytes: writeTotalBytes,
      totalGB: writeTotalGB,
      perVectorBytes: totalPerVectorBytes,
      monthlyCost: writeMonthlyCost,
    },
    query: {
      apiCallsCost: queryApiCost,
      dataProcessedBytes: totalDataProcessedBytes,
      dataProcessedTB: totalDataProcessedTB,
      dataProcessedCost: dataProcessedCost,
      monthlyCost: queryMonthlyCost,
    },
    embedding: {
      writeTokens: embeddingWriteTokens,
      queryTokens: embeddingQueryTokens,
      totalTokens: embeddingTotalTokens,
      writeCost: embeddingWriteCost,
      queryCost: embeddingQueryCost,
      monthlyCost: embeddingMonthlyCost,
    },
    totalMonthlyCost: storageMonthlyCost + writeMonthlyCost + queryMonthlyCost + embeddingMonthlyCost,
  };
}

