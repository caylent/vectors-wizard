import type { WizardStep } from "../types";

export const MONGODB_SELFHOSTED_WIZARD_STEPS: WizardStep[] = [
  {
    id: "deployment-type",
    type: "choice",
    botMessage: "What kind of MongoDB deployment do you need?",
    helpText: "MongoDB Community Edition is free (SSPL license). Vector search requires MongoDB 7.0+.",
    choices: [
      {
        label: "Development/Testing",
        description: "Single node, no HA",
        configPatch: {
          replicaCount: 1,
          includeConfigServers: 0,
          mongosCount: 0,
        },
      },
      {
        label: "Replica Set (HA)",
        description: "3-node replica set for production",
        configPatch: {
          replicaCount: 3,
          includeConfigServers: 0,
          mongosCount: 0,
        },
      },
      {
        label: "Sharded Cluster",
        description: "For large-scale horizontal scaling",
        configPatch: {
          replicaCount: 3,
          includeConfigServers: 1,
          mongosCount: 2,
        },
      },
    ],
    getNextStepId: () => "instance-size",
  },
  {
    id: "instance-size",
    type: "choice",
    botMessage: "What instance size do you need?",
    helpText: "Vector search indexes benefit from more RAM. Choose based on your data size.",
    choices: [
      {
        label: "t3.medium (4GB RAM) — ~$30/mo",
        description: "Dev/test workloads",
        configPatch: { instanceType: 0, storageGB: 50 },
      },
      {
        label: "m5.large (8GB RAM) — ~$70/mo",
        description: "Small production",
        configPatch: { instanceType: 2, storageGB: 100 },
      },
      {
        label: "m5.xlarge (16GB RAM) — ~$140/mo",
        description: "Medium production",
        configPatch: { instanceType: 3, storageGB: 200 },
      },
      {
        label: "r5.xlarge (32GB RAM) — ~$184/mo",
        description: "Memory-optimized for vector search",
        configPatch: { instanceType: 5, storageGB: 300 },
      },
      {
        label: "r5.2xlarge (64GB RAM) — ~$368/mo",
        description: "Large vector datasets",
        configPatch: { instanceType: 6, storageGB: 500 },
      },
    ],
    getNextStepId: () => "storage-type",
  },
  {
    id: "storage-type",
    type: "choice",
    botMessage: "What storage type?",
    helpText: "GP3 is cost-effective for most workloads. io1 for high IOPS requirements.",
    choices: [
      {
        label: "GP3 SSD ($0.08/GB)",
        description: "Recommended for most workloads",
        configPatch: { storageType: 0 },
      },
      {
        label: "io1 Provisioned IOPS ($0.125/GB)",
        description: "High-performance workloads",
        configPatch: { storageType: 1 },
      },
    ],
    getNextStepId: () => "summary",
  },
  {
    id: "summary",
    type: "info",
    botMessage:
      "All set! This estimate covers EC2 and EBS costs. MongoDB Community Edition (with Atlas Search) is free under the SSPL license.",
    getNextStepId: () => null,
  },
];
