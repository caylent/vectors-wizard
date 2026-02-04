// S3 Vectors pricing constants (US East - N. Virginia)
// Source: https://aws.amazon.com/s3/pricing/ (S3 Vectors section)

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
  const vectorDataBytes = 4 * inputs.dimensions; // float32
  const totalPerVectorBytes =
    vectorDataBytes +
    inputs.avgKeyLengthBytes +
    inputs.filterableMetadataBytes +
    inputs.nonFilterableMetadataBytes;

  // Storage
  const storageTotalBytes = totalPerVectorBytes * inputs.numVectors;
  const storageTotalGB = storageTotalBytes / (1024 ** 3);
  const storageMonthlyCost = storageTotalGB * PRICING.storage.perGBMonth;

  // Write
  const writeTotalBytes = totalPerVectorBytes * inputs.monthlyVectorsWritten;
  const writeTotalGB = writeTotalBytes / (1024 ** 3);
  const writeMonthlyCost = writeTotalGB * PRICING.write.perGBUploaded;

  // Query
  const queryApiCost =
    (inputs.monthlyQueries / 1_000_000) * PRICING.query.perMillionCalls;

  // Data processed: excludes non-filterable metadata
  const queryVectorSizeBytes =
    vectorDataBytes + inputs.avgKeyLengthBytes + inputs.filterableMetadataBytes;

  // Total data processed = per-query-scan-size * num_queries
  // per-query-scan-size = avg_vector_size * num_vectors_in_index
  const perQueryScanBytes = queryVectorSizeBytes * inputs.numVectors;
  const totalDataProcessedBytes = perQueryScanBytes * inputs.monthlyQueries;
  const totalDataProcessedTB = totalDataProcessedBytes / (1024 ** 4);

  // Tiered pricing for data processed
  let dataProcessedCost: number;
  if (inputs.numVectors <= PRICING.query.dataProcessed.tier1.upToVectors) {
    dataProcessedCost =
      totalDataProcessedTB * PRICING.query.dataProcessed.tier1.perTB;
  } else {
    // Blended: first 100K vectors at tier1 rate, rest at tier2
    const tier1Fraction =
      PRICING.query.dataProcessed.tier1.upToVectors / inputs.numVectors;
    const tier2Fraction = 1 - tier1Fraction;
    const blendedRate =
      tier1Fraction * PRICING.query.dataProcessed.tier1.perTB +
      tier2Fraction * PRICING.query.dataProcessed.tier2.perTB;
    dataProcessedCost = totalDataProcessedTB * blendedRate;
  }

  const queryMonthlyCost = queryApiCost + dataProcessedCost;

  // Embedding
  const costPerToken = inputs.embeddingCostPerMTokens / 1_000_000;
  const embeddingWriteTokens = inputs.monthlyVectorsWritten * inputs.avgTokensPerVector;
  const embeddingQueryTokens = inputs.monthlyQueries * inputs.avgTokensPerQuery;
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
