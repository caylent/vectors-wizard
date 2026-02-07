import type { PricingProvider, ProviderConfigField, ProviderCostBreakdown, CostLineItem } from "../types";
import {
  PRICING,
  calculateCosts as rawCalculateCosts,
  formatBytes,
  type CostInputs,
} from "./pricing";
import { TURBOPUFFER_PRESETS } from "./presets";
import { TURBOPUFFER_WIZARD_STEPS } from "./wizard-steps";
import { DIMENSION_SELECT_OPTIONS, createMinimumLineItem } from "../constants";

export type { CostInputs } from "./pricing";
export { formatBytes } from "./pricing";

const CONFIG_FIELDS: ProviderConfigField[] = [
  {
    key: "numVectors",
    label: "Number of vectors",
    tooltip: "Total vectors stored. Storage is billed on logical bytes.",
    type: "number",
    section: "Dataset Configuration",
    min: 1,
  },
  {
    key: "dimensions",
    label: "Vector dimensions",
    tooltip: "4 bytes per dimension (float32) or 2 bytes (float16).",
    type: "select",
    section: "Dataset Configuration",
    options: DIMENSION_SELECT_OPTIONS,
  },
  {
    key: "metadataBytes",
    label: "Metadata per vector",
    tooltip: "Average bytes of metadata per vector.",
    type: "number",
    section: "Dataset Configuration",
    suffix: "bytes",
  },
  {
    key: "monthlyWriteGB",
    label: "Monthly writes",
    tooltip: "Data written per month. Batch writes get up to 50% discount.",
    type: "number",
    section: "Monthly Usage",
    suffix: "GB/mo",
  },
  {
    key: "monthlyQueryGB",
    label: "Monthly queries",
    tooltip: "Data queried per month. 80% discount beyond 32GB per namespace per query.",
    type: "number",
    section: "Monthly Usage",
    suffix: "GB/mo",
  },
  {
    key: "plan",
    label: "Plan",
    tooltip: "Plan determines minimum spend and features.",
    type: "select",
    section: "Plan",
    options: [
      { value: 0, label: "Launch ($64/mo min)" },
      { value: 1, label: "Scale ($256/mo min)" },
      { value: 2, label: "Enterprise ($4,096/mo min)" },
    ],
  },
];

const DEFAULT_CONFIG: CostInputs = {
  numVectors: 1_000_000,
  dimensions: 1024,
  metadataBytes: 150,
  monthlyWriteGB: 20,
  monthlyQueryGB: 50,
  plan: "launch",
};

// Convert numeric plan to string
function normalizePlan(planNum: number): "launch" | "scale" | "enterprise" {
  switch (planNum) {
    case 0: return "launch";
    case 1: return "scale";
    case 2: return "enterprise";
    default: return "launch";
  }
}

export const turbopufferProvider: PricingProvider<CostInputs> = {
  id: "turbopuffer",
  name: "TurboPuffer",
  description: "TurboPuffer cost-optimized vector database",
  regionLabel: "Usage-based · S3-backed",
  configFields: CONFIG_FIELDS,
  defaultConfig: DEFAULT_CONFIG,
  calculateCosts: (config: CostInputs): ProviderCostBreakdown => {
    // Handle numeric plan from UI
    const normalizedConfig = typeof config.plan === "number"
      ? { ...config, plan: normalizePlan(config.plan as number) }
      : config;

    const raw = rawCalculateCosts(normalizedConfig);
    const planName = normalizedConfig.plan.charAt(0).toUpperCase() + normalizedConfig.plan.slice(1);

    const lineItems: CostLineItem[] = [
      {
        category: "storage",
        label: "Storage",
        amount: raw.storage.monthlyCost,
        details: {
          "Logical size": formatBytes(raw.storage.totalBytes),
          "Total TB": raw.storage.totalTB.toFixed(4),
          Rate: `$${PRICING.storage.perTBMonth}/TB-month`,
        },
        color: "#8555f0",
      },
      {
        category: "writes",
        label: "Writes",
        amount: raw.writes.monthlyCost,
        details: {
          "Data written": `${raw.writes.totalGB} GB`,
          Note: "Includes batch discount estimate",
        },
        color: "#97ca6f",
      },
      {
        category: "queries",
        label: "Queries",
        amount: raw.queries.monthlyCost,
        details: {
          "Data queried": `${raw.queries.totalGB} GB`,
          Note: "Includes volume discount estimate",
        },
        color: "#cbefae",
      },
    ];

    if (raw.subtotal < raw.minimum) {
      lineItems.push(createMinimumLineItem(raw.minimum - raw.subtotal, `${planName} plan requires $${raw.minimum}/mo minimum`));
    }

    return { lineItems, totalMonthlyCost: raw.totalMonthlyCost };
  },
  presets: TURBOPUFFER_PRESETS,
  wizardSteps: TURBOPUFFER_WIZARD_STEPS,
  entryStepId: "plan",
  pricingReference: [
    { label: "Storage", value: `$${PRICING.storage.perTBMonth}/TB-month` },
    { label: "Min (Launch)", value: `$${PRICING.minimum.launch}/month` },
    { label: "Min (Scale)", value: `$${PRICING.minimum.scale}/month` },
    { label: "Min (Enterprise)", value: `$${PRICING.minimum.enterprise}/month` },
  ],
  pricingDisclaimer:
    "Pricing based on logical bytes stored. Write/query costs include volume discount estimates. Actual costs may vary based on batch sizes and query patterns.",
  toUniversalConfig: (config) => ({
    numVectors: config.numVectors ?? 100_000,
    dimensions: config.dimensions ?? 1536,
    metadataBytes: config.metadataBytes ?? 200,
    monthlyQueries: 500_000,
    monthlyWrites: 50_000,
    embeddingCostPerMTokens: 0,
    avgTokensPerVector: 256,
    avgTokensPerQuery: 25,
  }),
  fromUniversalConfig: (universal) => {
    const vectorBytes = universal.dimensions * 4 + universal.metadataBytes;
    const monthlyWriteGB = (universal.monthlyWrites * vectorBytes) / (1024 ** 3);
    const monthlyQueryGB = (universal.monthlyQueries * universal.numVectors * 0.01 * vectorBytes) / (1024 ** 3);
    return {
      numVectors: universal.numVectors,
      dimensions: universal.dimensions,
      metadataBytes: universal.metadataBytes,
      monthlyWriteGB: Math.max(1, Math.ceil(monthlyWriteGB)),
      monthlyQueryGB: Math.max(1, Math.ceil(monthlyQueryGB)),
      plan: 0, // launch
    };
  },
};
