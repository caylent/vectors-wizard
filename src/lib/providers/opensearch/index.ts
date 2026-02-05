import type { PricingProvider, ProviderConfigField, ProviderCostBreakdown, CostLineItem } from "../types";
import {
  PRICING,
  calculateCosts as rawCalculateCosts,
  formatNumber,
  formatCurrency,
  type CostInputs,
} from "./pricing";
import { OPENSEARCH_PRESETS } from "./presets";
import { OPENSEARCH_WIZARD_STEPS } from "./wizard-steps";

export type { CostInputs } from "./pricing";
export { formatNumber, formatCurrency } from "./pricing";

const CONFIG_FIELDS: ProviderConfigField[] = [
  {
    key: "indexSizeGB",
    label: "Index size",
    tooltip: "Total size of your vector index including metadata. Stored in S3.",
    type: "number",
    section: "Index Configuration",
    suffix: "GB",
    min: 1,
  },
  {
    key: "deploymentMode",
    label: "Deployment mode",
    tooltip: "Production includes replicas for HA. Dev/Test uses minimum OCUs.",
    type: "select",
    section: "Index Configuration",
    options: [
      { value: 0, label: "Dev/Test" },
      { value: 1, label: "Production" },
    ],
  },
  {
    key: "monthlyQueries",
    label: "Monthly queries",
    tooltip: "Number of vector search queries per month. Affects Search OCU requirements.",
    type: "number",
    section: "Monthly Usage",
    suffix: "queries/mo",
  },
  {
    key: "monthlyWrites",
    label: "Monthly writes",
    tooltip: "Number of document writes per month. Affects Indexing OCU requirements.",
    type: "number",
    section: "Monthly Usage",
    suffix: "writes/mo",
  },
  {
    key: "maxSearchOCUs",
    label: "Max Search OCUs",
    tooltip: "Maximum Search OCUs to allocate. Controls auto-scaling limit.",
    type: "number",
    section: "OCU Limits",
    min: 0.5,
  },
  {
    key: "maxIndexingOCUs",
    label: "Max Indexing OCUs",
    tooltip: "Maximum Indexing OCUs to allocate. Controls auto-scaling limit.",
    type: "number",
    section: "OCU Limits",
    min: 0.5,
  },
];

const DEFAULT_CONFIG: CostInputs = {
  indexSizeGB: 10,
  deploymentMode: "production",
  monthlyQueries: 1_000_000,
  monthlyWrites: 100_000,
  maxSearchOCUs: 2,
  maxIndexingOCUs: 2,
};

// Convert numeric deployment mode to string
function normalizeConfig(config: Record<string, number>): CostInputs {
  return {
    ...config,
    deploymentMode: config.deploymentMode === 0 ? "dev-test" : "production",
  } as CostInputs;
}

export const opensearchProvider: PricingProvider<CostInputs> = {
  id: "opensearch",
  name: "OpenSearch Serverless",
  description: "Amazon OpenSearch Serverless for vector search",
  regionLabel: "US East (N. Virginia) · Serverless",
  configFields: CONFIG_FIELDS,
  defaultConfig: DEFAULT_CONFIG,
  calculateCosts: (config: CostInputs): ProviderCostBreakdown => {
    // Handle numeric deployment mode from UI
    const normalizedConfig = typeof config.deploymentMode === "number"
      ? normalizeConfig(config as unknown as Record<string, number>)
      : config;

    const raw = rawCalculateCosts(normalizedConfig);
    const lineItems: CostLineItem[] = [
      {
        category: "compute",
        label: "Compute (OCUs)",
        amount: raw.compute.monthlyCost,
        details: {
          "Search OCUs": raw.compute.searchOCUs,
          "Indexing OCUs": raw.compute.indexingOCUs,
          "Total OCUs": raw.compute.totalOCUs,
          Rate: `$${PRICING.ocu.perHour}/OCU-hour`,
        },
        color: "#8555f0",
      },
      {
        category: "storage",
        label: "Storage (S3)",
        amount: raw.storage.monthlyCost,
        details: {
          "Index size": `${raw.storage.totalGB} GB`,
          Rate: `$${PRICING.storage.perGBMonth}/GB-month`,
        },
        color: "#97ca6f",
      },
    ];

    return { lineItems, totalMonthlyCost: raw.totalMonthlyCost };
  },
  presets: OPENSEARCH_PRESETS,
  wizardSteps: OPENSEARCH_WIZARD_STEPS,
  entryStepId: "deployment-mode",
  pricingReference: [
    { label: "OCU (compute)", value: `$${PRICING.ocu.perHour}/OCU-hour` },
    { label: "Storage", value: `$${PRICING.storage.perGBMonth}/GB-month` },
    { label: "Min (Production)", value: "~$350/mo (2 OCUs)" },
    { label: "Min (Dev/Test)", value: "~$175/mo (1 OCU)" },
  ],
  pricingDisclaimer:
    "US East (N. Virginia) pricing. OCUs auto-scale and are billed per-second. Vector search collections require dedicated OCUs.",
};
