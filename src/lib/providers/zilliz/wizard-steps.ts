import type { WizardStep } from "../types";

export const ZILLIZ_WIZARD_STEPS: WizardStep[] = [
  {
    id: "use-case",
    type: "choice",
    botMessage: "What are you building with Zilliz Cloud?",
    helpText: "This helps us set sensible defaults for your workload.",
    choices: [
      {
        label: "RAG Application",
        description: "Retrieval-augmented generation",
        configPatch: {
          numVectors: 100_000,
          metadataBytes: 200,
          monthlyQueries: 1_000_000,
          monthlyWrites: 50_000,
        },
      },
      {
        label: "Semantic Search",
        description: "Product or content search",
        configPatch: {
          numVectors: 1_000_000,
          metadataBytes: 150,
          monthlyQueries: 5_000_000,
          monthlyWrites: 100_000,
        },
      },
      {
        label: "Recommendations",
        description: "Similar items, personalization",
        configPatch: {
          numVectors: 10_000_000,
          metadataBytes: 100,
          monthlyQueries: 10_000_000,
          monthlyWrites: 500_000,
        },
      },
      {
        label: "Something else",
        description: "Custom workload",
        configPatch: {},
      },
    ],
    getNextStepId: () => "dimensions",
  },
  {
    id: "dimensions",
    type: "choice",
    botMessage: "What vector dimensions are you using?",
    helpText: "Must match your embedding model output.",
    choices: [
      {
        label: "768 dimensions",
        description: "Sentence Transformers, some open models",
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
    botMessage: "How many vectors will you store?",
    choices: [
      {
        label: "Small — under 100K",
        description: "Prototypes, small apps",
        configPatch: { numVectors: 50_000 },
      },
      {
        label: "Medium — 100K–1M",
        description: "Growing applications",
        configPatch: { numVectors: 500_000 },
      },
      {
        label: "Large — 1M–10M",
        description: "Production scale",
        configPatch: { numVectors: 5_000_000 },
      },
      {
        label: "Very large — 10M+",
        description: "Enterprise scale",
        configPatch: { numVectors: 20_000_000 },
      },
    ],
    getNextStepId: () => "free-tier",
  },
  {
    id: "free-tier",
    type: "choice",
    botMessage: "Include Zilliz free tier credits?",
    helpText: "Free tier includes 5GB storage and 2.5M vCUs/month.",
    choices: [
      {
        label: "Yes, include free tier",
        description: "Deduct 5GB storage + 2.5M vCUs",
        configPatch: { includeFreeTier: 1 },
      },
      {
        label: "No, show full costs",
        description: "Calculate without free tier deductions",
        configPatch: { includeFreeTier: 0 },
      },
    ],
    getNextStepId: () => "summary",
  },
  {
    id: "summary",
    type: "info",
    botMessage:
      "All set! Your estimated Zilliz Cloud costs are shown. The serverless tier scales automatically based on usage.",
    getNextStepId: () => null,
  },
];
