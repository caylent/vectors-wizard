import type { WizardStep } from "../types";

export const MILVUS_WIZARD_STEPS: WizardStep[] = [
  {
    id: "deployment-type",
    type: "choice",
    botMessage: "What kind of Milvus deployment do you need?",
    helpText: "Milvus is free (Apache 2.0). You pay only for infrastructure.",
    choices: [
      {
        label: "Development/Testing",
        description: "Single node, no HA",
        configPatch: {
          instanceCount: 1,
          includeEtcd: 0,
          includeMinio: 0,
        },
      },
      {
        label: "Production (single node)",
        description: "With etcd for coordination",
        configPatch: {
          instanceCount: 1,
          includeEtcd: 1,
          includeMinio: 0,
        },
      },
      {
        label: "Production HA",
        description: "Multi-node with full HA stack",
        configPatch: {
          instanceCount: 3,
          includeEtcd: 1,
          includeMinio: 1,
        },
      },
    ],
    getNextStepId: () => "instance-size",
  },
  {
    id: "instance-size",
    type: "choice",
    botMessage: "What instance size do you need?",
    helpText: "Memory is the key constraint. Vectors should fit in RAM for best performance.",
    choices: [
      {
        label: "t3.medium (4GB RAM) — ~$30/mo",
        description: "Dev/test, up to ~500K vectors",
        configPatch: { instanceType: 0, storageGB: 50 },
      },
      {
        label: "m5.large (8GB RAM) — ~$70/mo",
        description: "Small production, up to ~1M vectors",
        configPatch: { instanceType: 2, storageGB: 100 },
      },
      {
        label: "m5.xlarge (16GB RAM) — ~$140/mo",
        description: "Medium production, up to ~3M vectors",
        configPatch: { instanceType: 3, storageGB: 200 },
      },
      {
        label: "r5.xlarge (32GB RAM) — ~$184/mo",
        description: "Memory-optimized, up to ~5M vectors",
        configPatch: { instanceType: 5, storageGB: 300 },
      },
      {
        label: "r5.2xlarge (64GB RAM) — ~$368/mo",
        description: "Large scale, up to ~10M vectors",
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
    getNextStepId: () => "object-storage",
  },
  {
    id: "object-storage",
    type: "choice",
    botMessage: "How will you handle object storage?",
    helpText: "Milvus uses object storage (S3 or MinIO) for persistence.",
    choices: [
      {
        label: "Use AWS S3",
        description: "Managed, pay-per-use (not included in estimate)",
        configPatch: { includeMinio: 0 },
      },
      {
        label: "Self-hosted MinIO",
        description: "2 instances for redundancy (~$60/mo)",
        configPatch: { includeMinio: 1 },
      },
    ],
    getNextStepId: () => "summary",
  },
  {
    id: "summary",
    type: "info",
    botMessage:
      "All set! This estimate covers EC2, EBS, and optional etcd/MinIO. S3 costs and data transfer are additional. Milvus software is free.",
    getNextStepId: () => null,
  },
];
