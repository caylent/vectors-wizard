import type { PricingProvider, ProviderConfigField, ProviderCostBreakdown, CostLineItem } from "../types";
import {
  PRICING,
  calculateCosts as rawCalculateCosts,
  formatCurrency,
  type CostInputs,
  type InstanceType,
} from "./pricing";
import { MONGODB_SELFHOSTED_PRESETS } from "./presets";
import { MONGODB_SELFHOSTED_WIZARD_STEPS } from "./wizard-steps";

export type { CostInputs } from "./pricing";
export { formatCurrency } from "./pricing";

const INSTANCE_TYPES: InstanceType[] = [
  "t3.medium",
  "t3.large",
  "m5.large",
  "m5.xlarge",
  "m5.2xlarge",
  "r5.xlarge",
  "r5.2xlarge",
  "r5.4xlarge",
];

const CONFIG_FIELDS: ProviderConfigField[] = [
  {
    key: "instanceType",
    label: "Instance type",
    tooltip: "EC2 instance type for MongoDB nodes. RAM is key for vector search performance.",
    type: "select",
    section: "Compute",
    options: INSTANCE_TYPES.map((type, i) => ({
      value: i,
      label: `${type} (${PRICING.instances[type].ram}GB RAM)`,
    })),
  },
  {
    key: "replicaCount",
    label: "Replica set nodes",
    tooltip: "Number of nodes in the replica set. Use 3 for production HA.",
    type: "select",
    section: "Compute",
    options: [
      { value: 1, label: "1 (standalone)" },
      { value: 3, label: "3 (replica set)" },
      { value: 5, label: "5 (extended HA)" },
    ],
  },
  {
    key: "storageGB",
    label: "Storage per node",
    tooltip: "EBS storage per instance for data and indexes.",
    type: "number",
    section: "Storage",
    suffix: "GB",
    min: 20,
  },
  {
    key: "storageType",
    label: "Storage type",
    tooltip: "GP3 for most workloads, io1 for high IOPS needs.",
    type: "select",
    section: "Storage",
    options: [
      { value: 0, label: "GP3 SSD" },
      { value: 1, label: "io1 Provisioned IOPS" },
    ],
  },
  {
    key: "dataTransferGB",
    label: "Data transfer out",
    tooltip: "Estimated monthly data transfer out of AWS. First 100GB free.",
    type: "number",
    section: "Network",
    suffix: "GB/mo",
  },
  {
    key: "includeConfigServers",
    label: "Sharded cluster",
    tooltip: "Include config servers for sharded deployments (adds 3 t3.small instances).",
    type: "select",
    section: "Sharding",
    options: [
      { value: 0, label: "No (replica set only)" },
      { value: 1, label: "Yes (sharded)" },
    ],
  },
  {
    key: "mongosCount",
    label: "Mongos routers",
    tooltip: "Number of mongos query routers for sharded clusters.",
    type: "number",
    section: "Sharding",
    min: 0,
  },
];

const DEFAULT_CONFIG: CostInputs = {
  instanceType: "m5.large",
  replicaCount: 3,
  storageGB: 100,
  storageType: "gp3",
  dataTransferGB: 100,
  includeConfigServers: 0,
  mongosCount: 0,
};

// Convert numeric values to expected types
function normalizeConfig(config: Record<string, number>): CostInputs {
  return {
    instanceType: INSTANCE_TYPES[config.instanceType] || "m5.large",
    replicaCount: config.replicaCount,
    storageGB: config.storageGB,
    storageType: config.storageType === 0 ? "gp3" : "io1",
    dataTransferGB: config.dataTransferGB,
    includeConfigServers: config.includeConfigServers,
    mongosCount: config.mongosCount,
  };
}

export const mongodbSelfhostedProvider: PricingProvider<CostInputs> = {
  id: "mongodb-selfhosted",
  name: "MongoDB (Self-Hosted)",
  description: "Self-hosted MongoDB with Vector Search on AWS",
  regionLabel: "AWS US East · Infrastructure Costs Only",
  configFields: CONFIG_FIELDS,
  defaultConfig: DEFAULT_CONFIG,
  calculateCosts: (config: CostInputs): ProviderCostBreakdown => {
    // Handle numeric values from UI
    const normalizedConfig = typeof config.instanceType === "number"
      ? normalizeConfig(config as unknown as Record<string, number>)
      : config;

    const raw = rawCalculateCosts(normalizedConfig);

    const lineItems: CostLineItem[] = [
      {
        category: "compute",
        label: "EC2 Compute",
        amount: raw.compute.monthlyCost,
        details: {
          "Instance type": raw.compute.instanceType,
          "Replica nodes": raw.compute.replicaCount,
          "Per node": formatCurrency(raw.compute.perInstanceCost),
        },
        color: "#8555f0",
      },
      {
        category: "storage",
        label: "EBS Storage",
        amount: raw.storage.monthlyCost,
        details: {
          "Total storage": `${raw.storage.totalGB} GB`,
          Type: raw.storage.type,
        },
        color: "#97ca6f",
      },
    ];

    if (raw.dataTransfer.monthlyCost > 0) {
      lineItems.push({
        category: "transfer",
        label: "Data Transfer",
        amount: raw.dataTransfer.monthlyCost,
        details: {
          "Transfer out": `${raw.dataTransfer.totalGB} GB`,
          Note: "First 100GB free",
        },
        color: "#cbefae",
      });
    }

    if (raw.configServers.included) {
      lineItems.push({
        category: "configservers",
        label: "Config Servers",
        amount: raw.configServers.monthlyCost,
        details: {
          Nodes: "3x t3.small",
          Purpose: "Sharded cluster metadata",
        },
        color: "#f59e0b",
      });
    }

    if (raw.mongos.count > 0) {
      lineItems.push({
        category: "mongos",
        label: "Mongos Routers",
        amount: raw.mongos.monthlyCost,
        details: {
          Count: `${raw.mongos.count}x t3.medium`,
          "Per router": formatCurrency(raw.mongos.perInstanceCost),
        },
        color: "#5ba4f5",
      });
    }

    // Add software cost note
    lineItems.push({
      category: "software",
      label: "MongoDB Software",
      amount: 0,
      details: {
        Edition: "Community Edition",
        License: "SSPL (Free)",
        Note: "Vector Search in MongoDB 7.0+",
      },
      color: "#34d399",
    });

    return { lineItems, totalMonthlyCost: raw.totalMonthlyCost };
  },
  presets: MONGODB_SELFHOSTED_PRESETS,
  wizardSteps: MONGODB_SELFHOSTED_WIZARD_STEPS,
  entryStepId: "deployment-type",
  pricingReference: [
    { label: "t3.medium", value: "~$30/mo" },
    { label: "m5.large", value: "~$70/mo" },
    { label: "r5.xlarge", value: "~$184/mo" },
    { label: "GP3 Storage", value: "$0.08/GB-mo" },
    { label: "MongoDB", value: "Free (SSPL)" },
  ],
  pricingDisclaimer:
    "AWS US East pricing estimates. Vector Search requires MongoDB 7.0+. MongoDB Community Edition is free under the SSPL license. Consider operational overhead for self-managed deployments.",
  toUniversalConfig: () => ({
    numVectors: 100_000,
    dimensions: 1536,
    metadataBytes: 200,
    monthlyQueries: 500_000,
    monthlyWrites: 50_000,
    embeddingCostPerMTokens: 0,
    avgTokensPerVector: 256,
    avgTokensPerQuery: 25,
  }),
  fromUniversalConfig: (universal) => {
    // Estimate instance type from memory needs (2x raw vector size for working set)
    const memoryNeededGB = (universal.numVectors * universal.dimensions * 4) / (1024 ** 3) * 2;
    let instanceType = 0; // t3.medium
    if (memoryNeededGB > 32) instanceType = 6; // r5.2xlarge
    else if (memoryNeededGB > 16) instanceType = 5; // r5.xlarge
    else if (memoryNeededGB > 8) instanceType = 3; // m5.xlarge
    else if (memoryNeededGB > 4) instanceType = 2; // m5.large
    return {
      instanceType,
      replicaCount: 3,
      storageGB: Math.max(50, Math.ceil((universal.numVectors * (universal.dimensions * 4 + universal.metadataBytes) * 1.5) / (1024 ** 3))),
      storageType: 0, // gp3
      dataTransferGB: Math.ceil(universal.monthlyQueries * 0.001),
      includeConfigServers: 0,
      mongosCount: 0,
    };
  },
};
