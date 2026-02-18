import type { PricingProvider, ProviderConfigField, ProviderCostBreakdown, CostLineItem } from "../types";
import {
  PRICING,
  calculateCosts as rawCalculateCosts,
  formatBytes,
  formatNumber,
  type CostInputs,
} from "./pricing";
import { ZILLIZ_PRESETS } from "./presets";
import { ZILLIZ_WIZARD_STEPS } from "./wizard-steps";
import { DIMENSION_SELECT_OPTIONS } from "../constants";

export type { CostInputs } from "./pricing";
export { formatBytes, formatNumber } from "./pricing";

const CONFIG_FIELDS: ProviderConfigField[] = [
  {
    key: "numVectors",
    label: "Number of vectors",
    tooltip: "Total vectors stored in your Zilliz collection.",
    type: "number",
    section: "Collection Configuration",
    min: 1,
  },
  {
    key: "dimensions",
    label: "Vector dimensions",
    tooltip: "Dimension count of your embedding vectors.",
    type: "select",
    section: "Collection Configuration",
    options: DIMENSION_SELECT_OPTIONS,
  },
  {
    key: "metadataBytes",
    label: "Metadata per vector",
    tooltip: "Average bytes of metadata stored per vector.",
    type: "number",
    section: "Collection Configuration",
    suffix: "bytes",
  },
  {
    key: "monthlyQueries",
    label: "Monthly queries",
    tooltip: "Number of vector search queries per month. Consumes vCUs.",
    type: "number",
    section: "Monthly Usage",
    suffix: "queries/mo",
  },
  {
    key: "monthlyWrites",
    label: "Monthly writes",
    tooltip: "Number of vector inserts/updates per month. Consumes vCUs.",
    type: "number",
    section: "Monthly Usage",
    suffix: "writes/mo",
  },
  {
    key: "includeFreeTier",
    label: "Include free tier",
    tooltip: "Deduct free tier credits (5GB storage, 2.5M vCUs).",
    type: "select",
    section: "Billing",
    options: [
      { value: 0, label: "No" },
      { value: 1, label: "Yes" },
    ],
  },
];

const DEFAULT_CONFIG: CostInputs = {
  numVectors: 100_000,
  dimensions: 1536,
  metadataBytes: 200,
  monthlyQueries: 1_000_000,
  monthlyWrites: 100_000,
  includeFreeTier: 1,
};

export const zillizProvider: PricingProvider<CostInputs> = {
  id: "zilliz",
  name: "Zilliz Cloud",
  description: "Zilliz Cloud Serverless (Milvus managed)",
  regionLabel: "Serverless · Standard",
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
          "Total size": formatBytes(raw.storage.totalBytes),
          "Billable": `${raw.storage.billableGB.toFixed(2)} GB`,
          ...(raw.storage.freeGB > 0 ? { "Free tier": `${raw.storage.freeGB} GB` } : {}),
          Rate: `$${PRICING.storage.perGBMonth}/GB-month`,
        },
        color: "#8555f0",
      },
      {
        category: "compute",
        label: "Compute (vCUs)",
        amount: raw.compute.monthlyCost,
        details: {
          "Query vCUs": formatNumber(raw.compute.queryVCUs),
          "Write vCUs": formatNumber(raw.compute.writeVCUs),
          "Billable vCUs": formatNumber(raw.compute.billableVCUs),
          ...(raw.compute.freeVCUs > 0 ? { "Free tier": formatNumber(raw.compute.freeVCUs) } : {}),
          Rate: `$${PRICING.vcu.perMillion}/M vCUs`,
        },
        color: "#97ca6f",
      },
    ];

    return { lineItems, totalMonthlyCost: raw.totalMonthlyCost };
  },
  presets: ZILLIZ_PRESETS,
  wizardSteps: ZILLIZ_WIZARD_STEPS,
  entryStepId: "use-case",
  pricingReference: [
    { label: "Storage", value: `$${PRICING.storage.perGBMonth}/GB-month` },
    { label: "vCUs", value: `$${PRICING.vcu.perMillion}/million vCUs` },
    { label: "Free tier", value: "5GB + 2.5M vCUs/month" },
  ],
  pricingDisclaimer:
    "Serverless pricing. Free tier available. Enterprise and Dedicated tiers have different pricing models.",
  toUniversalConfig: (config) => ({
    numVectors: config.numVectors ?? 100_000,
    dimensions: config.dimensions ?? 1536,
    metadataBytes: config.metadataBytes ?? 200,
    monthlyQueries: config.monthlyQueries ?? 500_000,
    monthlyWrites: config.monthlyWrites ?? 50_000,
    embeddingCostPerMTokens: 0,
    avgTokensPerVector: 256,
    avgTokensPerQuery: 25,
  }),
  fromUniversalConfig: (universal) => ({
    numVectors: universal.numVectors,
    dimensions: universal.dimensions,
    metadataBytes: universal.metadataBytes,
    monthlyQueries: universal.monthlyQueries,
    monthlyWrites: universal.monthlyWrites,
    includeFreeTier: 1,
  }),
};
