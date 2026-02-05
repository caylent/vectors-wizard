import type { PricingProvider, ProviderConfigField, ProviderCostBreakdown, CostLineItem } from "../types";
import {
  PRICING,
  calculateCosts as rawCalculateCosts,
  formatNumber,
  type CostInputs,
} from "./pricing";
import { WEAVIATE_PRESETS } from "./presets";
import { WEAVIATE_WIZARD_STEPS } from "./wizard-steps";

export type { CostInputs } from "./pricing";
export { formatNumber } from "./pricing";

const DIMENSION_OPTIONS = [256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096] as const;

const CONFIG_FIELDS: ProviderConfigField[] = [
  {
    key: "numObjects",
    label: "Number of objects",
    tooltip: "Total objects (vectors) stored in Weaviate.",
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
    options: DIMENSION_OPTIONS.map((d) => ({ value: d, label: `${d}` })),
  },
  {
    key: "replicationFactor",
    label: "Replication factor",
    tooltip: "Number of replicas. Higher replication multiplies dimension costs.",
    type: "select",
    section: "Collection Configuration",
    options: [
      { value: 1, label: "1 (no replication)" },
      { value: 2, label: "2 (standard HA)" },
      { value: 3, label: "3 (high availability)" },
    ],
  },
  {
    key: "storageGiB",
    label: "Storage",
    tooltip: "Total disk storage for indexes, metadata, and database state.",
    type: "number",
    section: "Storage",
    suffix: "GiB",
    min: 1,
  },
  {
    key: "backupGiB",
    label: "Backup storage",
    tooltip: "Snapshot volume retained. Flex plan retains 7 days.",
    type: "number",
    section: "Storage",
    suffix: "GiB",
    min: 0,
  },
];

const DEFAULT_CONFIG: CostInputs = {
  numObjects: 100_000,
  dimensions: 1536,
  replicationFactor: 1,
  storageGiB: 5,
  backupGiB: 2,
};

export const weaviateProvider: PricingProvider<CostInputs> = {
  id: "weaviate",
  name: "Weaviate",
  description: "Weaviate Cloud (Flex Plan)",
  regionLabel: "Flex Plan · Shared Infrastructure",
  configFields: CONFIG_FIELDS,
  defaultConfig: DEFAULT_CONFIG,
  calculateCosts: (config: CostInputs): ProviderCostBreakdown => {
    const raw = rawCalculateCosts(config);
    const lineItems: CostLineItem[] = [
      {
        category: "dimensions",
        label: "Vector Dimensions",
        amount: raw.dimensions.monthlyCost,
        details: {
          "Total dimensions": formatNumber(raw.dimensions.totalDimensions),
          "Objects × Dims × Replicas": `${formatNumber(config.numObjects)} × ${config.dimensions} × ${config.replicationFactor}`,
          Rate: `$${PRICING.dimensions.perMillion}/M dimensions`,
        },
        color: "#8555f0",
      },
      {
        category: "storage",
        label: "Storage",
        amount: raw.storage.monthlyCost,
        details: {
          "Total storage": `${raw.storage.totalGiB} GiB`,
          Rate: `$${PRICING.storage.perGiB}/GiB-month`,
        },
        color: "#97ca6f",
      },
      {
        category: "backup",
        label: "Backup Storage",
        amount: raw.backup.monthlyCost,
        details: {
          "Backup volume": `${raw.backup.totalGiB} GiB`,
          Rate: `$${PRICING.backup.perGiB}/GiB-month`,
        },
        color: "#cbefae",
      },
    ];

    // Add minimum notice if applicable
    if (raw.subtotal < PRICING.minimum) {
      lineItems.push({
        category: "minimum",
        label: "Plan Minimum",
        amount: PRICING.minimum - raw.subtotal,
        details: {
          Note: `Flex plan requires $${PRICING.minimum}/mo minimum`,
        },
        color: "#f59e0b",
      });
    }

    return { lineItems, totalMonthlyCost: raw.totalMonthlyCost };
  },
  presets: WEAVIATE_PRESETS,
  wizardSteps: WEAVIATE_WIZARD_STEPS,
  entryStepId: "use-case",
  pricingReference: [
    { label: "Dimensions", value: `$${PRICING.dimensions.perMillion}/M dims` },
    { label: "Storage", value: `$${PRICING.storage.perGiB}/GiB-month` },
    { label: "Backup", value: `$${PRICING.backup.perGiB}/GiB-month` },
    { label: "Minimum", value: `$${PRICING.minimum}/month (Flex)` },
  ],
  pricingDisclaimer:
    "Flex plan pricing. Premium plan offers lower per-unit rates but higher minimum ($400/mo).",
};
