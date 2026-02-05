import type { PricingProvider, ProviderConfigField, ProviderCostBreakdown, CostLineItem } from "../types";
import {
  PRICING,
  calculateCosts as rawCalculateCosts,
  formatCurrency,
  type CostInputs,
  type DedicatedTier,
} from "./pricing";
import { MONGODB_PRESETS } from "./presets";
import { MONGODB_WIZARD_STEPS } from "./wizard-steps";

export type { CostInputs } from "./pricing";
export { formatCurrency } from "./pricing";

const DEDICATED_TIERS: DedicatedTier[] = ["M10", "M20", "M30", "M40", "M50", "M60", "M80"];

const CONFIG_FIELDS: ProviderConfigField[] = [
  {
    key: "clusterType",
    label: "Cluster type",
    tooltip: "Flex for serverless-like pricing, Dedicated for fixed resources.",
    type: "select",
    section: "Cluster Configuration",
    options: [
      { value: 0, label: "Flex" },
      { value: 1, label: "Dedicated" },
    ],
  },
  {
    key: "flexOpsPerSec",
    label: "Ops/sec (Flex)",
    tooltip: "Expected operations per second. Only applies to Flex tier.",
    type: "number",
    section: "Flex Configuration",
    suffix: "ops/sec",
    min: 1,
  },
  {
    key: "dedicatedTier",
    label: "Cluster tier",
    tooltip: "Instance size for dedicated clusters. M10+ required for vector search.",
    type: "select",
    section: "Dedicated Configuration",
    options: DEDICATED_TIERS.map((tier, i) => ({
      value: i,
      label: `${tier} (${PRICING.dedicated.tiers[tier].ram}GB RAM)`,
    })),
  },
  {
    key: "storageGB",
    label: "Storage",
    tooltip: "Storage is included in tier pricing up to tier maximum.",
    type: "number",
    section: "Dedicated Configuration",
    suffix: "GB",
    min: 10,
  },
  {
    key: "replicaCount",
    label: "Replica count",
    tooltip: "Number of nodes in the replica set. Standard is 3.",
    type: "select",
    section: "Dedicated Configuration",
    options: [
      { value: 3, label: "3 nodes" },
      { value: 5, label: "5 nodes" },
      { value: 7, label: "7 nodes" },
    ],
  },
];

const DEFAULT_CONFIG: CostInputs = {
  clusterType: "dedicated",
  flexOpsPerSec: 100,
  dedicatedTier: "M10",
  storageGB: 20,
  replicaCount: 3,
};

// Convert numeric values to expected types
function normalizeConfig(config: Record<string, number>): CostInputs {
  const clusterType = config.clusterType === 0 ? "flex" : "dedicated";
  const dedicatedTier = DEDICATED_TIERS[config.dedicatedTier] || "M10";
  return {
    clusterType,
    flexOpsPerSec: config.flexOpsPerSec,
    dedicatedTier,
    storageGB: config.storageGB,
    replicaCount: config.replicaCount,
  };
}

export const mongodbProvider: PricingProvider<CostInputs> = {
  id: "mongodb",
  name: "MongoDB Atlas",
  description: "MongoDB Atlas with built-in Vector Search",
  regionLabel: "AWS US East · Vector Search Included",
  configFields: CONFIG_FIELDS,
  defaultConfig: DEFAULT_CONFIG,
  calculateCosts: (config: CostInputs): ProviderCostBreakdown => {
    // Handle numeric values from UI
    const normalizedConfig = typeof config.clusterType === "number"
      ? normalizeConfig(config as unknown as Record<string, number>)
      : config;

    const raw = rawCalculateCosts(normalizedConfig);

    const lineItems: CostLineItem[] = [
      {
        category: "compute",
        label: normalizedConfig.clusterType === "flex" ? "Flex Cluster" : "Cluster Compute",
        amount: raw.compute.monthlyCost,
        details: {
          Tier: raw.compute.tier,
          ...(normalizedConfig.clusterType === "dedicated"
            ? {
                "Per node": formatCurrency(raw.compute.perNodeCost),
                Nodes: normalizedConfig.replicaCount,
              }
            : {}),
        },
        color: "#8555f0",
      },
    ];

    if (normalizedConfig.clusterType === "dedicated") {
      lineItems.push({
        category: "storage",
        label: "Storage",
        amount: raw.storage.additionalCost,
        details: {
          "Total storage": `${raw.storage.totalGB} GB`,
          Status: raw.storage.included ? "Included in tier" : "Additional charges may apply",
        },
        color: "#97ca6f",
      });
    }

    // Add vector search note
    lineItems.push({
      category: "vectorsearch",
      label: "Vector Search",
      amount: 0,
      details: {
        Note: "Included at no extra cost",
      },
      color: "#5ba4f5",
    });

    return { lineItems, totalMonthlyCost: raw.totalMonthlyCost };
  },
  presets: MONGODB_PRESETS,
  wizardSteps: MONGODB_WIZARD_STEPS,
  entryStepId: "cluster-type",
  pricingReference: [
    { label: "Flex", value: "$8-30/month" },
    { label: "M10", value: "~$58/node/month" },
    { label: "M30", value: "~$394/node/month" },
    { label: "M50", value: "~$1,460/node/month" },
    { label: "Vector Search", value: "Included" },
  ],
  pricingDisclaimer:
    "AWS US East pricing. Vector Search is included with M10+ clusters. Prices shown for standard replica set (typically 3 nodes).",
};
