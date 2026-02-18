import type { PricingProvider, ProviderConfigField, ProviderCostBreakdown, CostLineItem } from "../types";
import {
  PRICING,
  calculateCosts as rawCalculateCosts,
  formatCurrency,
  type CostInputs,
  type InstanceType,
} from "./pricing";
import { MILVUS_PRESETS } from "./presets";
import { MILVUS_WIZARD_STEPS } from "./wizard-steps";

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
];

const CONFIG_FIELDS: ProviderConfigField[] = [
  {
    key: "instanceType",
    label: "Instance type",
    tooltip: "EC2 instance type for Milvus nodes. Memory is the key constraint.",
    type: "select",
    section: "Compute",
    options: INSTANCE_TYPES.map((type, i) => ({
      value: i,
      label: `${type} (${PRICING.instances[type].ram}GB RAM)`,
    })),
  },
  {
    key: "instanceCount",
    label: "Instance count",
    tooltip: "Number of Milvus nodes. Use 3+ for high availability.",
    type: "number",
    section: "Compute",
    min: 1,
  },
  {
    key: "storageGB",
    label: "Storage per instance",
    tooltip: "EBS storage per instance for indexes and data.",
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
    key: "includeEtcd",
    label: "Include etcd cluster",
    tooltip: "etcd is required for production deployments (3 t3.small instances).",
    type: "select",
    section: "Dependencies",
    options: [
      { value: 0, label: "No" },
      { value: 1, label: "Yes (production)" },
    ],
  },
  {
    key: "includeMinio",
    label: "Include MinIO",
    tooltip: "Self-hosted object storage. Alternative is using AWS S3 directly.",
    type: "select",
    section: "Dependencies",
    options: [
      { value: 0, label: "No (use S3)" },
      { value: 1, label: "Yes (self-hosted)" },
    ],
  },
];

const DEFAULT_CONFIG: CostInputs = {
  instanceType: "m5.large",
  instanceCount: 1,
  storageGB: 100,
  storageType: "gp3",
  dataTransferGB: 100,
  includeEtcd: 1,
  includeMinio: 0,
};

// Convert numeric values to expected types
function normalizeConfig(config: Record<string, number>): CostInputs {
  const instanceIndex = config.instanceType ?? 2; // default to m5.large (index 2)
  return {
    instanceType: INSTANCE_TYPES[instanceIndex] || "m5.large",
    instanceCount: config.instanceCount ?? 1,
    storageGB: config.storageGB ?? 100,
    storageType: config.storageType === 0 ? "gp3" : "io1",
    dataTransferGB: config.dataTransferGB ?? 100,
    includeEtcd: config.includeEtcd ?? 1,
    includeMinio: config.includeMinio ?? 0,
  };
}

export const milvusProvider: PricingProvider<CostInputs> = {
  id: "milvus",
  name: "Milvus (Self-Hosted)",
  description: "Self-hosted Milvus on AWS infrastructure",
  regionLabel: "AWS US East · Infrastructure Costs Only",
  configFields: CONFIG_FIELDS,
  defaultConfig: DEFAULT_CONFIG,
  calculateCosts: (config: CostInputs): ProviderCostBreakdown => {
    // Handle numeric values from UI or missing/undefined values during provider transitions
    const normalizedConfig = typeof config.instanceType === "number" || typeof config.instanceType === "undefined"
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
          "Instance count": raw.compute.instanceCount,
          "Per instance": formatCurrency(raw.compute.perInstanceCost),
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

    if (raw.etcd.included) {
      lineItems.push({
        category: "etcd",
        label: "etcd Cluster",
        amount: raw.etcd.monthlyCost,
        details: {
          Nodes: "3x t3.small",
          "Per node": formatCurrency(raw.etcd.instanceCost),
        },
        color: "#f59e0b",
      });
    }

    if (raw.minio.included) {
      lineItems.push({
        category: "minio",
        label: "MinIO (Object Storage)",
        amount: raw.minio.monthlyCost,
        details: {
          Nodes: "2x t3.medium",
          "Per node": formatCurrency(raw.minio.instanceCost),
        },
        color: "#5ba4f5",
      });
    }

    // Add software cost note
    lineItems.push({
      category: "software",
      label: "Milvus Software",
      amount: 0,
      details: {
        License: "Apache 2.0 (Free)",
      },
      color: "#34d399",
    });

    return { lineItems, totalMonthlyCost: raw.totalMonthlyCost };
  },
  presets: MILVUS_PRESETS,
  wizardSteps: MILVUS_WIZARD_STEPS,
  entryStepId: "deployment-type",
  pricingReference: [
    { label: "t3.medium", value: "~$30/mo" },
    { label: "m5.large", value: "~$70/mo" },
    { label: "r5.xlarge", value: "~$184/mo" },
    { label: "GP3 Storage", value: "$0.08/GB-mo" },
    { label: "Milvus", value: "Free (Apache 2.0)" },
  ],
  pricingDisclaimer:
    "AWS US East pricing estimates. Actual costs may vary. Does not include S3 storage costs if using S3 instead of MinIO. Milvus software is free under Apache 2.0 license.",
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
    const memoryNeededGB = (universal.numVectors * universal.dimensions * 4) / (1024 ** 3) * 2;
    let instanceType = 0; // t3.medium
    if (memoryNeededGB > 32) instanceType = 6; // r5.2xlarge
    else if (memoryNeededGB > 16) instanceType = 5; // r5.xlarge
    else if (memoryNeededGB > 8) instanceType = 3; // m5.xlarge
    else if (memoryNeededGB > 4) instanceType = 2; // m5.large
    return {
      instanceType,
      instanceCount: 1,
      storageGB: Math.max(50, Math.ceil((universal.numVectors * (universal.dimensions * 4 + universal.metadataBytes) * 1.5) / (1024 ** 3))),
      storageType: 0, // gp3
      dataTransferGB: Math.ceil(universal.monthlyQueries * 0.001),
      includeEtcd: 1,
      includeMinio: 0,
    };
  },
};
