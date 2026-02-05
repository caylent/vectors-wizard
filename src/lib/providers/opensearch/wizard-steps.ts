import type { WizardStep } from "../types";

export const OPENSEARCH_WIZARD_STEPS: WizardStep[] = [
  {
    id: "deployment-mode",
    type: "choice",
    botMessage: "What type of deployment do you need?",
    helpText: "Dev/Test mode uses fewer OCUs but has less redundancy. Production mode includes replicas for high availability.",
    choices: [
      {
        label: "Dev/Test",
        description: "Lower cost, reduced redundancy (min ~$175/mo)",
        configPatch: {
          deploymentMode: 0, // dev-test
          maxSearchOCUs: 1,
          maxIndexingOCUs: 1,
        },
      },
      {
        label: "Production",
        description: "High availability with replicas (min ~$350/mo)",
        configPatch: {
          deploymentMode: 1, // production
          maxSearchOCUs: 2,
          maxIndexingOCUs: 2,
        },
      },
    ],
    getNextStepId: () => "index-size",
  },
  {
    id: "index-size",
    type: "choice",
    botMessage: "How large is your vector index?",
    helpText: "Total size including vectors and metadata. Vectors use 4 bytes × dimensions per record.",
    choices: [
      {
        label: "Small — under 10 GB",
        description: "Up to ~1M vectors at 1536 dimensions",
        configPatch: { indexSizeGB: 10 },
      },
      {
        label: "Medium — 10–100 GB",
        description: "1M–10M vectors",
        configPatch: { indexSizeGB: 50 },
      },
      {
        label: "Large — 100 GB–1 TB",
        description: "10M–100M vectors",
        configPatch: { indexSizeGB: 500 },
      },
      {
        label: "Very large — 1 TB+",
        description: "100M+ vectors",
        configPatch: { indexSizeGB: 2000 },
      },
      {
        label: "I know the exact size",
        description: "Enter a specific size",
        configPatch: {},
        nextStepId: "custom-index-size",
      },
    ],
    getNextStepId: (config) =>
      config._lastChoice === "I know the exact size" ? "custom-index-size" : "query-volume",
  },
  {
    id: "custom-index-size",
    type: "number",
    botMessage: "What's your expected index size in GB?",
    numberFields: [
      {
        key: "indexSizeGB",
        label: "Index size",
        suffix: "GB",
        placeholder: "e.g. 100",
        min: 1,
      },
    ],
    getNextStepId: () => "query-volume",
  },
  {
    id: "query-volume",
    type: "choice",
    botMessage: "How many queries per month?",
    helpText: "Higher query volumes may require more Search OCUs to maintain performance.",
    choices: [
      {
        label: "Light — under 500K",
        description: "Internal tools, low-traffic apps",
        configPatch: { monthlyQueries: 250_000 },
      },
      {
        label: "Moderate — 500K–5M",
        description: "Production apps with steady traffic",
        configPatch: { monthlyQueries: 2_000_000 },
      },
      {
        label: "High — 5M–50M",
        description: "High-traffic applications",
        configPatch: { monthlyQueries: 20_000_000 },
      },
      {
        label: "Very high — 50M+",
        description: "Large-scale production",
        configPatch: { monthlyQueries: 100_000_000 },
      },
    ],
    getNextStepId: () => "write-volume",
  },
  {
    id: "write-volume",
    type: "choice",
    botMessage: "How many documents written per month?",
    helpText: "Higher write volumes may require more Indexing OCUs.",
    choices: [
      {
        label: "Mostly static",
        description: "Under 100K writes/month",
        configPatch: { monthlyWrites: 50_000 },
      },
      {
        label: "Regular updates",
        description: "100K–1M writes/month",
        configPatch: { monthlyWrites: 500_000 },
      },
      {
        label: "Frequent changes",
        description: "1M–10M writes/month",
        configPatch: { monthlyWrites: 5_000_000 },
      },
      {
        label: "High-volume pipeline",
        description: "10M+ writes/month",
        configPatch: { monthlyWrites: 20_000_000 },
      },
    ],
    getNextStepId: () => "summary",
  },
  {
    id: "summary",
    type: "info",
    botMessage:
      "All set! Your estimated OpenSearch Serverless costs are shown. OCUs auto-scale based on workload and are billed per-second.",
    getNextStepId: () => null,
  },
];
