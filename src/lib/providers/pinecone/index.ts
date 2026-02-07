import type { PricingProvider, ProviderConfigField, ProviderCostBreakdown, CostLineItem } from "../types";
import {
  PRICING,
  calculateCosts as rawCalculateCosts,
  formatBytes,
  formatCurrency,
  formatNumber,
  type CostInputs,
} from "./pricing";
import { PINECONE_PRESETS } from "./presets";
import { PINECONE_WIZARD_STEPS } from "./wizard-steps";
import { DIMENSION_SELECT_OPTIONS, createMinimumLineItem } from "../constants";

export type { CostInputs } from "./pricing";
export { formatBytes, formatNumber, formatCurrency } from "./pricing";

const CONFIG_FIELDS: ProviderConfigField[] = [
  {
    key: "numVectors",
    label: "Number of vectors",
    tooltip: "Total vectors stored in your Pinecone index.",
    type: "number",
    section: "Index Configuration",
    min: 1,
  },
  {
    key: "dimensions",
    label: "Embedding dimensions",
    tooltip: "Must match your embedding model output. Common: 1536 (OpenAI), 1024 (Cohere), 768 (Sentence Transformers).",
    type: "select",
    section: "Index Configuration",
    options: DIMENSION_SELECT_OPTIONS,
  },
  {
    key: "metadataBytes",
    label: "Metadata per vector",
    tooltip: "Average bytes of metadata stored per vector. Used for filtering and returned with results.",
    type: "number",
    section: "Index Configuration",
    suffix: "bytes",
  },
  {
    key: "monthlyQueries",
    label: "Monthly queries",
    tooltip: "Number of similarity search queries per month. Each query is one read unit.",
    type: "number",
    section: "Monthly Usage",
    suffix: "queries/mo",
  },
  {
    key: "monthlyUpserts",
    label: "Monthly upserts",
    tooltip: "Number of vector inserts or updates per month. Each upsert is one write unit.",
    type: "number",
    section: "Monthly Usage",
    suffix: "upserts/mo",
  },
  {
    key: "embeddingCostPerMTokens",
    label: "Cost per 1M tokens",
    tooltip: "Your embedding model's price per million input tokens. Set to 0 to exclude embedding costs.",
    type: "number",
    section: "Embedding Model",
    suffix: "$/M tokens",
  },
  {
    key: "avgTokensPerVector",
    label: "Tokens per vector",
    tooltip: "Average input tokens per text chunk being embedded.",
    type: "number",
    section: "Embedding Model",
    suffix: "tokens",
  },
  {
    key: "avgTokensPerQuery",
    label: "Tokens per query",
    tooltip: "Average input tokens per search query.",
    type: "number",
    section: "Embedding Model",
    suffix: "tokens",
  },
];

const DEFAULT_CONFIG: CostInputs = {
  numVectors: 100_000,
  dimensions: 1536,
  metadataBytes: 200,
  monthlyQueries: 500_000,
  monthlyUpserts: 10_000,
  embeddingCostPerMTokens: 0.02,
  avgTokensPerVector: 256,
  avgTokensPerQuery: 25,
};

export const pineconeProvider: PricingProvider<CostInputs> = {
  id: "pinecone",
  name: "Pinecone",
  description: "Pinecone Serverless vector database",
  regionLabel: "Standard Plan · Serverless",
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
        category: "reads",
        label: "Read Units",
        amount: raw.reads.monthlyCost,
        details: {
          "Queries/mo": formatNumber(raw.reads.totalQueries),
          Rate: `$${PRICING.readUnits.perMillion}/M queries`,
        },
        color: "#97ca6f",
      },
      {
        category: "writes",
        label: "Write Units",
        amount: raw.writes.monthlyCost,
        details: {
          "Upserts/mo": formatNumber(raw.writes.totalUpserts),
          Rate: `$${PRICING.writeUnits.perMillion}/M upserts`,
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

    if (raw.subtotal < PRICING.minimum) {
      lineItems.push(createMinimumLineItem(PRICING.minimum - raw.subtotal, `Standard plan requires $${PRICING.minimum}/mo minimum`));
    }

    return { lineItems, totalMonthlyCost: raw.totalMonthlyCost };
  },
  presets: PINECONE_PRESETS,
  wizardSteps: PINECONE_WIZARD_STEPS,
  entryStepId: "use-case",
  pricingReference: [
    { label: "Storage", value: `$${PRICING.storage.perGBMonth}/GB-month` },
    { label: "Read Units", value: `$${PRICING.readUnits.perMillion}/M queries` },
    { label: "Write Units", value: `$${PRICING.writeUnits.perMillion}/M upserts` },
    { label: "Minimum", value: `$${PRICING.minimum}/month (Standard)` },
  ],
  pricingDisclaimer:
    "Standard Plan pricing. Starter (free) tier available with limits. Enterprise plan has different rates.",
  toUniversalConfig: (config) => ({
    numVectors: config.numVectors ?? 100_000,
    dimensions: config.dimensions ?? 1536,
    metadataBytes: config.metadataBytes ?? 200,
    monthlyQueries: config.monthlyQueries ?? 500_000,
    monthlyWrites: config.monthlyUpserts ?? 50_000,
    embeddingCostPerMTokens: config.embeddingCostPerMTokens ?? 0,
    avgTokensPerVector: config.avgTokensPerVector ?? 256,
    avgTokensPerQuery: config.avgTokensPerQuery ?? 25,
  }),
  fromUniversalConfig: (universal) => ({
    numVectors: universal.numVectors,
    dimensions: universal.dimensions,
    metadataBytes: universal.metadataBytes,
    monthlyQueries: universal.monthlyQueries,
    monthlyUpserts: universal.monthlyWrites,
    embeddingCostPerMTokens: universal.embeddingCostPerMTokens,
    avgTokensPerVector: universal.avgTokensPerVector,
    avgTokensPerQuery: universal.avgTokensPerQuery,
  }),
};
