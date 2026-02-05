import type { WizardStep } from "../types";

export const PINECONE_WIZARD_STEPS: WizardStep[] = [
  {
    id: "use-case",
    type: "choice",
    botMessage: "What are you building with Pinecone?",
    helpText: "This helps us set sensible defaults for your workload.",
    choices: [
      {
        label: "RAG Chatbot",
        description: "Retrieval-augmented generation with document chunks",
        configPatch: {
          numVectors: 100_000,
          metadataBytes: 200,
          monthlyQueries: 500_000,
          monthlyUpserts: 10_000,
          avgTokensPerVector: 256,
          avgTokensPerQuery: 25,
        },
      },
      {
        label: "Semantic Search",
        description: "Product or content search with natural language",
        configPatch: {
          numVectors: 1_000_000,
          metadataBytes: 150,
          monthlyQueries: 5_000_000,
          monthlyUpserts: 50_000,
          avgTokensPerVector: 100,
          avgTokensPerQuery: 20,
        },
      },
      {
        label: "Recommendation Engine",
        description: "Similar items, personalization, content discovery",
        configPatch: {
          numVectors: 10_000_000,
          metadataBytes: 100,
          monthlyQueries: 2_000_000,
          monthlyUpserts: 1_000_000,
          avgTokensPerVector: 0,
          avgTokensPerQuery: 0,
        },
      },
      {
        label: "Something else",
        description: "Custom workload — you'll set everything manually",
        configPatch: {},
      },
    ],
    getNextStepId: () => "embedding-model",
  },
  {
    id: "embedding-model",
    type: "choice",
    botMessage: "Which embedding model are you using?",
    helpText: "The dimension count determines storage costs (4 bytes per dimension).",
    choices: [
      {
        label: "OpenAI text-embedding-3-small",
        description: "1536 dims · $0.02/M tokens",
        configPatch: { dimensions: 1536, embeddingCostPerMTokens: 0.02 },
      },
      {
        label: "OpenAI text-embedding-3-large",
        description: "3072 dims · $0.13/M tokens",
        configPatch: { dimensions: 3072, embeddingCostPerMTokens: 0.13 },
      },
      {
        label: "Cohere Embed v3",
        description: "1024 dims · $0.10/M tokens",
        configPatch: { dimensions: 1024, embeddingCostPerMTokens: 0.10 },
      },
      {
        label: "Pinecone Inference",
        description: "1024 dims · $0.08-0.16/M tokens",
        configPatch: { dimensions: 1024, embeddingCostPerMTokens: 0.12 },
      },
      {
        label: "Custom",
        description: "Enter your own dimension count",
        configPatch: {},
        nextStepId: "custom-dimensions",
      },
    ],
    getNextStepId: (config) =>
      config._lastChoice === "Custom" ? "custom-dimensions" : "dataset-size",
  },
  {
    id: "custom-dimensions",
    type: "number",
    botMessage: "How many dimensions does your embedding model output?",
    helpText: "Common values: 256, 384, 512, 768, 1024, 1536, 2048, 3072.",
    numberFields: [
      {
        key: "dimensions",
        label: "Dimensions",
        placeholder: "e.g. 1536",
        min: 1,
        max: 4096,
      },
    ],
    getNextStepId: () => "dataset-size",
  },
  {
    id: "dataset-size",
    type: "choice",
    botMessage: "How many vectors will you store?",
    helpText: "Each item in your dataset becomes one vector.",
    choices: [
      {
        label: "Small — up to 10K",
        description: "Prototypes, small catalogs, internal tools",
        configPatch: { numVectors: 10_000 },
      },
      {
        label: "Medium — 10K–100K",
        description: "Growing product catalog, docs site",
        configPatch: { numVectors: 100_000 },
      },
      {
        label: "Large — 100K–1M",
        description: "Large e-commerce, enterprise docs",
        configPatch: { numVectors: 1_000_000 },
      },
      {
        label: "Very large — 1M+",
        description: "Massive scale applications",
        configPatch: { numVectors: 10_000_000 },
      },
      {
        label: "I know the exact number",
        description: "Enter a specific vector count",
        configPatch: {},
        nextStepId: "custom-vector-count",
      },
    ],
    getNextStepId: (config) =>
      config._lastChoice === "I know the exact number" ? "custom-vector-count" : "query-volume",
  },
  {
    id: "custom-vector-count",
    type: "number",
    botMessage: "How many vectors will you store?",
    numberFields: [
      {
        key: "numVectors",
        label: "Number of vectors",
        placeholder: "e.g. 100000",
        min: 1,
      },
    ],
    getNextStepId: () => "query-volume",
  },
  {
    id: "query-volume",
    type: "choice",
    botMessage: "How many queries per month?",
    helpText: "Each similarity search counts as one read unit.",
    choices: [
      {
        label: "Light — under 100K",
        description: "Internal tools, low-traffic apps",
        configPatch: { monthlyQueries: 50_000 },
      },
      {
        label: "Moderate — 100K–1M",
        description: "Production apps with steady traffic",
        configPatch: { monthlyQueries: 500_000 },
      },
      {
        label: "High — 1M–10M",
        description: "High-traffic search or recommendations",
        configPatch: { monthlyQueries: 5_000_000 },
      },
      {
        label: "Very high — 10M+",
        description: "Large-scale production workloads",
        configPatch: { monthlyQueries: 20_000_000 },
      },
    ],
    getNextStepId: () => "write-volume",
  },
  {
    id: "write-volume",
    type: "choice",
    botMessage: "How many vectors written (upserted) per month?",
    helpText: "Each insert or update counts as one write unit.",
    choices: [
      {
        label: "Mostly static",
        description: "Rarely updated — under 10K/month",
        configPatch: { monthlyUpserts: 5_000 },
      },
      {
        label: "Regular updates",
        description: "Weekly additions — 10K–100K/month",
        configPatch: { monthlyUpserts: 50_000 },
      },
      {
        label: "Frequent changes",
        description: "Daily ingestion — 100K–1M/month",
        configPatch: { monthlyUpserts: 500_000 },
      },
      {
        label: "High-volume pipeline",
        description: "Continuous updates — 1M+/month",
        configPatch: { monthlyUpserts: 2_000_000 },
      },
    ],
    getNextStepId: () => "summary",
  },
  {
    id: "summary",
    type: "info",
    botMessage:
      "All set! Your estimated Pinecone costs are shown in the results panel. Note: Standard plan has a $50/month minimum.",
    getNextStepId: () => null,
  },
];
