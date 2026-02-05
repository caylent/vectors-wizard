import type { WizardStep } from "../types";

export const MONGODB_WIZARD_STEPS: WizardStep[] = [
  {
    id: "cluster-type",
    type: "choice",
    botMessage: "What type of MongoDB Atlas cluster do you need?",
    helpText: "Vector Search is included with all cluster types at no extra cost.",
    choices: [
      {
        label: "Flex (serverless-like)",
        description: "Pay per ops/sec, 5GB storage included",
        configPatch: { clusterType: 0 },
      },
      {
        label: "Dedicated cluster",
        description: "Fixed resources, predictable pricing",
        configPatch: { clusterType: 1 },
      },
    ],
    getNextStepId: (config) =>
      config.clusterType === 0 || config._lastChoice === "Flex (serverless-like)"
        ? "flex-ops"
        : "dedicated-tier",
  },
  {
    id: "flex-ops",
    type: "choice",
    botMessage: "What's your expected ops/sec rate?",
    helpText: "Operations include reads, writes, and vector searches.",
    choices: [
      {
        label: "Up to 100 ops/sec ($8/mo)",
        description: "Light development or testing",
        configPatch: { flexOpsPerSec: 100 },
      },
      {
        label: "Up to 200 ops/sec ($15/mo)",
        description: "Small production workload",
        configPatch: { flexOpsPerSec: 200 },
      },
      {
        label: "Up to 300 ops/sec ($21/mo)",
        description: "Growing application",
        configPatch: { flexOpsPerSec: 300 },
      },
      {
        label: "Up to 500 ops/sec ($30/mo)",
        description: "Moderate traffic",
        configPatch: { flexOpsPerSec: 500 },
      },
    ],
    getNextStepId: () => "summary",
  },
  {
    id: "dedicated-tier",
    type: "choice",
    botMessage: "What cluster tier do you need?",
    helpText: "Vector search requires M10 or higher. Choose based on data size and query complexity.",
    choices: [
      {
        label: "M10 — 2GB RAM, 2 vCPU (~$58/mo per node)",
        description: "Small workloads, up to 128GB storage",
        configPatch: { dedicatedTier: 0, storageGB: 20 },
      },
      {
        label: "M20 — 4GB RAM, 2 vCPU (~$146/mo per node)",
        description: "Growing workloads, up to 256GB storage",
        configPatch: { dedicatedTier: 1, storageGB: 50 },
      },
      {
        label: "M30 — 8GB RAM, 2 vCPU (~$394/mo per node)",
        description: "Production workloads, up to 512GB storage",
        configPatch: { dedicatedTier: 2, storageGB: 100 },
      },
      {
        label: "M40 — 16GB RAM, 4 vCPU (~$759/mo per node)",
        description: "Large workloads, up to 1TB storage",
        configPatch: { dedicatedTier: 3, storageGB: 200 },
      },
    ],
    getNextStepId: () => "replica-count",
  },
  {
    id: "replica-count",
    type: "choice",
    botMessage: "How many replica set members?",
    helpText: "Standard is 3 nodes (primary + 2 secondaries). More nodes improve read scaling and availability.",
    choices: [
      {
        label: "3 nodes (standard)",
        description: "Primary + 2 secondaries for HA",
        configPatch: { replicaCount: 3 },
      },
      {
        label: "5 nodes",
        description: "Higher read capacity and fault tolerance",
        configPatch: { replicaCount: 5 },
      },
      {
        label: "7 nodes",
        description: "Maximum fault tolerance",
        configPatch: { replicaCount: 7 },
      },
    ],
    getNextStepId: () => "summary",
  },
  {
    id: "summary",
    type: "info",
    botMessage:
      "All set! MongoDB Atlas includes vector search at no additional cost. You pay only for the cluster resources.",
    getNextStepId: () => null,
  },
];
