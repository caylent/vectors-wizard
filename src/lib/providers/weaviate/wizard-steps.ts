import type { WizardStep } from "../types";

export const WEAVIATE_WIZARD_STEPS: WizardStep[] = [
  {
    id: "use-case",
    type: "choice",
    botMessage: "What are you building with Weaviate?",
    choices: [
      {
        label: "RAG / Semantic Search",
        description: "Document retrieval and chat",
        configPatch: {
          numObjects: 100_000,
          dimensions: 1536,
          storageGiB: 5,
          backupGiB: 2,
        },
      },
      {
        label: "Product Search",
        description: "E-commerce catalog search",
        configPatch: {
          numObjects: 1_000_000,
          dimensions: 1024,
          storageGiB: 20,
          backupGiB: 10,
        },
      },
      {
        label: "Knowledge Base",
        description: "Large-scale enterprise search",
        configPatch: {
          numObjects: 10_000_000,
          dimensions: 1024,
          storageGiB: 100,
          backupGiB: 50,
        },
      },
      {
        label: "Something else",
        description: "Custom workload",
        configPatch: {},
      },
    ],
    getNextStepId: () => "replication",
  },
  {
    id: "replication",
    type: "choice",
    botMessage: "What level of redundancy do you need?",
    helpText: "Higher replication improves availability but increases dimension costs proportionally.",
    choices: [
      {
        label: "Single replica (1x)",
        description: "Development or cost-optimized",
        configPatch: { replicationFactor: 1 },
      },
      {
        label: "Standard HA (2x)",
        description: "Production with failover",
        configPatch: { replicationFactor: 2 },
      },
      {
        label: "High availability (3x)",
        description: "Mission-critical workloads",
        configPatch: { replicationFactor: 3 },
      },
    ],
    getNextStepId: () => "dimensions",
  },
  {
    id: "dimensions",
    type: "choice",
    botMessage: "What vector dimensions are you using?",
    choices: [
      {
        label: "768 dimensions",
        description: "Sentence Transformers",
        configPatch: { dimensions: 768 },
      },
      {
        label: "1024 dimensions",
        description: "Cohere, Voyage, Nova",
        configPatch: { dimensions: 1024 },
      },
      {
        label: "1536 dimensions",
        description: "OpenAI text-embedding-3-small",
        configPatch: { dimensions: 1536 },
      },
      {
        label: "3072 dimensions",
        description: "OpenAI text-embedding-3-large",
        configPatch: { dimensions: 3072 },
      },
    ],
    getNextStepId: () => "dataset-size",
  },
  {
    id: "dataset-size",
    type: "choice",
    botMessage: "How many objects will you store?",
    choices: [
      {
        label: "Small — under 100K",
        description: "~2-5 GiB storage",
        configPatch: { numObjects: 50_000, storageGiB: 3, backupGiB: 1 },
      },
      {
        label: "Medium — 100K–1M",
        description: "~5-20 GiB storage",
        configPatch: { numObjects: 500_000, storageGiB: 15, backupGiB: 7 },
      },
      {
        label: "Large — 1M–10M",
        description: "~20-150 GiB storage",
        configPatch: { numObjects: 5_000_000, storageGiB: 80, backupGiB: 40 },
      },
      {
        label: "Very large — 10M+",
        description: "150+ GiB storage",
        configPatch: { numObjects: 20_000_000, storageGiB: 300, backupGiB: 150 },
      },
    ],
    getNextStepId: () => "summary",
  },
  {
    id: "summary",
    type: "info",
    botMessage:
      "All set! Your estimated Weaviate costs are shown. Flex plan has a $45/month minimum.",
    getNextStepId: () => null,
  },
];
