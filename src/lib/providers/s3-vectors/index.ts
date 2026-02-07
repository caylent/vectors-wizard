import type { PricingProvider, ProviderConfigField, ProviderCostBreakdown, CostLineItem } from "../types";
import {
  PRICING,
  calculateCosts as rawCalculateCosts,
  formatBytes,
  formatCurrency,
  formatNumber,
  type CostInputs,
} from "./pricing";
import { S3_VECTORS_PRESETS } from "./presets";
import { S3_VECTORS_WIZARD_STEPS } from "./wizard-steps";
import { DIMENSION_SELECT_OPTIONS } from "../constants";

export type { CostInputs } from "./pricing";
export { formatBytes, formatNumber, formatCurrency } from "./pricing";

const CONFIG_FIELDS: ProviderConfigField[] = [
  {
    key: "numVectors",
    label: "Number of vectors",
    tooltip:
      "Total vectors stored in the index. S3 Vectors supports up to 2 billion per index.",
    type: "number",
    section: "Index Configuration",
    min: 1,
  },
  {
    key: "dimensions",
    label: "Embedding dimensions",
    tooltip:
      "Must match your embedding model output. Common: 1024 (Nova Embeddings, Voyage 4, Cohere v4), 1536 (Cohere v4, OpenAI small), 3072 (Nova Embeddings, OpenAI large).",
    type: "select",
    section: "Index Configuration",
    options: DIMENSION_SELECT_OPTIONS,
  },
  {
    key: "avgKeyLengthBytes",
    label: "Avg key length",
    tooltip: "Unique string identifier for each vector. 1 byte per character.",
    type: "number",
    section: "Per-Vector Data",
    suffix: "bytes",
  },
  {
    key: "filterableMetadataBytes",
    label: "Filterable metadata",
    tooltip:
      "Metadata used in query filters (e.g., category, tenant_id). Max 2 KB. Included in query data-processed cost.",
    type: "number",
    section: "Per-Vector Data",
    suffix: "bytes",
  },
  {
    key: "nonFilterableMetadataBytes",
    label: "Non-filterable metadata",
    tooltip:
      "Metadata returned with results but NOT used in filters (e.g., source text). Excluded from query data-processed cost. Max 40 KB total.",
    type: "number",
    section: "Per-Vector Data",
    suffix: "bytes",
  },
  {
    key: "monthlyQueries",
    label: "Query volume",
    tooltip:
      "Number of QueryVectors API calls per month. Each call returns up to topK=100 results.",
    type: "number",
    section: "Monthly Usage",
    suffix: "queries/mo",
  },
  {
    key: "monthlyVectorsWritten",
    label: "Vectors written",
    tooltip:
      "Number of vectors inserted or updated per month via PutVectors. Batch up to 500 per call.",
    type: "number",
    section: "Monthly Usage",
    suffix: "vectors/mo",
  },
  {
    key: "embeddingCostPerMTokens",
    label: "Cost per 1M tokens",
    tooltip:
      "Your embedding model's price per million input tokens. Examples: $0.14 (Nova Embeddings), $0.06 (Voyage 4), $0.12 (Cohere v4), $0.02 (OpenAI small). Set to 0 to exclude.",
    type: "number",
    section: "Embedding Model",
    suffix: "$/M tokens",
  },
  {
    key: "avgTokensPerVector",
    label: "Tokens per vector",
    tooltip:
      "Average input tokens per chunk/document being embedded. A typical RAG chunk of ~500 words is ~375 tokens. Shorter product descriptions may be ~50\u2013100 tokens.",
    type: "number",
    section: "Embedding Model",
    suffix: "tokens",
  },
  {
    key: "avgTokensPerQuery",
    label: "Tokens per query",
    tooltip:
      "Average input tokens per search query. Short keyword queries are ~10 tokens; longer natural-language questions are ~30\u201350 tokens.",
    type: "number",
    section: "Embedding Model",
    suffix: "tokens",
  },
];

const DEFAULT_CONFIG: CostInputs = {
  numVectors: 100_000,
  dimensions: 1536,
  avgKeyLengthBytes: 30,
  filterableMetadataBytes: 200,
  nonFilterableMetadataBytes: 500,
  monthlyQueries: 500_000,
  monthlyVectorsWritten: 10_000,
  embeddingCostPerMTokens: 0.14,
  avgTokensPerVector: 256,
  avgTokensPerQuery: 25,
};

export const s3VectorsProvider: PricingProvider<CostInputs> = {
  id: "s3-vectors",
  name: "S3 Vectors",
  description: "Amazon S3 Vectors managed vector database",
  regionLabel: "US East (N. Virginia) pricing \u00b7 On-Demand",
  configFields: CONFIG_FIELDS,
  defaultConfig: DEFAULT_CONFIG,
  calculateCosts: (config: CostInputs): ProviderCostBreakdown => {
    const raw = rawCalculateCosts(config);
    const lineItems: CostLineItem[] = [
      {
        category: "storage",
        label: "Storage",
        amount: raw.storage.monthlyCost,
        details: {
          "Total stored": formatBytes(raw.storage.totalBytes),
          Rate: `$${PRICING.storage.perGBMonth}/GB-month`,
        },
        color: "#8555f0",
      },
      {
        category: "write",
        label: "Writes (PUT)",
        amount: raw.write.monthlyCost,
        details: {
          "Data uploaded/mo": formatBytes(raw.write.totalBytes),
          Rate: `$${PRICING.write.perGBUploaded}/GB`,
          "Vectors written": config.monthlyVectorsWritten,
        },
        color: "#97ca6f",
      },
      {
        category: "query",
        label: "Queries",
        amount: raw.query.monthlyCost,
        details: {
          "API calls cost": formatCurrency(raw.query.apiCallsCost),
          "Data processed":
            raw.query.dataProcessedTB > 0.001
              ? `${raw.query.dataProcessedTB.toFixed(3)} TB`
              : formatBytes(raw.query.dataProcessedBytes),
          "Data processed cost": formatCurrency(raw.query.dataProcessedCost),
        },
        color: "#cbefae",
      },
      {
        category: "embedding",
        label: "Embeddings",
        amount: raw.embedding.monthlyCost,
        details: {
          "Write tokens": `${formatNumber(raw.embedding.writeTokens)} (${formatCurrency(raw.embedding.writeCost)})`,
          "Query tokens": `${formatNumber(raw.embedding.queryTokens)} (${formatCurrency(raw.embedding.queryCost)})`,
          Rate: `$${config.embeddingCostPerMTokens}/M tokens`,
        },
        color: "#5ba4f5",
      },
    ];
    return { lineItems, totalMonthlyCost: raw.totalMonthlyCost };
  },
  presets: S3_VECTORS_PRESETS,
  wizardSteps: S3_VECTORS_WIZARD_STEPS,
  entryStepId: "use-case",
  pricingReference: [
    { label: "Storage", value: `$${PRICING.storage.perGBMonth}/GB-month` },
    { label: "PUT", value: `$${PRICING.write.perGBUploaded}/GB uploaded` },
    {
      label: "Query API",
      value: `$${PRICING.query.perMillionCalls}/M calls`,
    },
    {
      label: "Query data (\u2264100K vecs)",
      value: `$${PRICING.query.dataProcessed.tier1.perTB}/TB processed`,
    },
    {
      label: "Query data (>100K vecs)",
      value: `$${PRICING.query.dataProcessed.tier2.perTB}/TB processed`,
    },
  ],
  pricingDisclaimer:
    "Prices shown for US East (N. Virginia). Excludes data transfer, KMS, and GetVectors/ListVectors/DeleteVectors request charges.",
  toUniversalConfig: (config) => ({
    numVectors: config.numVectors ?? 100_000,
    dimensions: config.dimensions ?? 1536,
    metadataBytes: (config.filterableMetadataBytes ?? 0) + (config.nonFilterableMetadataBytes ?? 0),
    monthlyQueries: config.monthlyQueries ?? 500_000,
    monthlyWrites: config.monthlyVectorsWritten ?? 50_000,
    embeddingCostPerMTokens: config.embeddingCostPerMTokens ?? 0,
    avgTokensPerVector: config.avgTokensPerVector ?? 256,
    avgTokensPerQuery: config.avgTokensPerQuery ?? 25,
  }),
  fromUniversalConfig: (universal) => ({
    numVectors: universal.numVectors,
    dimensions: universal.dimensions,
    avgKeyLengthBytes: 30,
    filterableMetadataBytes: Math.round(universal.metadataBytes * 0.4),
    nonFilterableMetadataBytes: Math.round(universal.metadataBytes * 0.6),
    monthlyQueries: universal.monthlyQueries,
    monthlyVectorsWritten: universal.monthlyWrites,
    embeddingCostPerMTokens: universal.embeddingCostPerMTokens,
    avgTokensPerVector: universal.avgTokensPerVector,
    avgTokensPerQuery: universal.avgTokensPerQuery,
  }),
};
