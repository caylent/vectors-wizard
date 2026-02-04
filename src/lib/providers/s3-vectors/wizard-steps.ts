import type { WizardStep } from "../types";

export const S3_VECTORS_WIZARD_STEPS: WizardStep[] = [
  {
    id: "use-case",
    type: "choice",
    botMessage: "What are you building?",
    helpText: "This helps us set sensible defaults for your workload.",
    choices: [
      {
        label: "RAG Chatbot",
        description: "Retrieval-augmented generation with document chunks",
        configPatch: {
          numVectors: 100_000,
          avgKeyLengthBytes: 30,
          filterableMetadataBytes: 200,
          nonFilterableMetadataBytes: 500,
          monthlyQueries: 500_000,
          monthlyVectorsWritten: 10_000,
          avgTokensPerVector: 256,
          avgTokensPerQuery: 25,
        },
      },
      {
        label: "Product Search",
        description: "Semantic search over a product catalog",
        configPatch: {
          numVectors: 1_000_000,
          avgKeyLengthBytes: 20,
          filterableMetadataBytes: 300,
          nonFilterableMetadataBytes: 100,
          monthlyQueries: 5_000_000,
          monthlyVectorsWritten: 50_000,
          avgTokensPerVector: 80,
          avgTokensPerQuery: 15,
        },
      },
      {
        label: "Knowledge Base",
        description: "Large-scale document store for enterprise search",
        configPatch: {
          numVectors: 10_000_000,
          avgKeyLengthBytes: 40,
          filterableMetadataBytes: 150,
          nonFilterableMetadataBytes: 1000,
          monthlyQueries: 2_000_000,
          monthlyVectorsWritten: 500_000,
          avgTokensPerVector: 375,
          avgTokensPerQuery: 30,
        },
      },
      {
        label: "Something else",
        description: "Custom workload \u2014 you\u2019ll set everything manually",
        configPatch: {},
      },
    ],
    getNextStepId: () => "embedding-model",
  },
  {
    id: "embedding-model",
    type: "choice",
    botMessage: "Which embedding model are you using?",
    helpText: "The dimension count determines how much storage each vector needs (4 bytes per dimension for float32).",
    choices: [
      {
        label: "Amazon Nova Multimodal Embeddings",
        description: "256/384/1024/3072 dims \u00b7 $0.14/M tokens (Bedrock)",
        configPatch: { dimensions: 1024, embeddingCostPerMTokens: 0.14 },
      },
      {
        label: "Cohere Embed v4",
        description: "256/512/1024/1536 dims \u00b7 $0.12/M tokens",
        configPatch: { dimensions: 1536, embeddingCostPerMTokens: 0.12 },
      },
      {
        label: "Voyage 4 Large",
        description: "256/512/1024/2048 dims \u00b7 $0.12/M tokens",
        configPatch: { dimensions: 1024, embeddingCostPerMTokens: 0.12 },
      },
      {
        label: "Voyage 4",
        description: "256/512/1024/2048 dims \u00b7 $0.06/M tokens",
        configPatch: { dimensions: 1024, embeddingCostPerMTokens: 0.06 },
      },
      {
        label: "Voyage 4 Lite",
        description: "256/512/1024/2048 dims \u00b7 $0.02/M tokens",
        configPatch: { dimensions: 1024, embeddingCostPerMTokens: 0.02 },
      },
      {
        label: "OpenAI text-embedding-3-small",
        description: "1536 dims (shortening supported) \u00b7 $0.02/M tokens",
        configPatch: { dimensions: 1536, embeddingCostPerMTokens: 0.02 },
      },
      {
        label: "OpenAI text-embedding-3-large",
        description: "3072 dims (shortening supported) \u00b7 $0.13/M tokens",
        configPatch: { dimensions: 3072, embeddingCostPerMTokens: 0.13 },
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
    helpText: "Common values: 256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096.",
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
    botMessage: "How large is the dataset you\u2019re searching over?",
    helpText: "Each item in your dataset becomes one vector. For documents, that\u2019s typically one vector per text chunk (a few paragraphs each).",
    choices: [
      {
        label: "Small \u2014 up to 1,000 items",
        description: "A FAQ page, a small help center, or a handful of PDFs",
        configPatch: { numVectors: 1_000 },
      },
      {
        label: "Medium \u2014 ~10K\u2013100K items",
        description: "A product catalog, a docs site, or hundreds of documents",
        configPatch: { numVectors: 100_000 },
      },
      {
        label: "Large \u2014 ~100K\u20131M items",
        description: "Thousands of documents, a large e-commerce catalog, or years of support tickets",
        configPatch: { numVectors: 1_000_000 },
      },
      {
        label: "Very large \u2014 1M+ items",
        description: "Enterprise-scale: millions of pages, images, or records",
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
      config._lastChoice === "I know the exact number" ? "custom-vector-count" : "metadata",
  },
  {
    id: "custom-vector-count",
    type: "number",
    botMessage: "How many vectors will you store?",
    helpText:
      "For RAG, this is roughly equal to your number of text chunks. A 100-page document might produce ~500\u20131,000 chunks.",
    numberFields: [
      {
        key: "numVectors",
        label: "Number of vectors",
        placeholder: "e.g. 100000",
        min: 1,
      },
    ],
    getNextStepId: () => "metadata",
  },
  {
    id: "metadata",
    type: "choice",
    botMessage: "What extra info do you need to store and filter on alongside each vector?",
    helpText:
      "Think of metadata as labels attached to each item. \"Filterable\" metadata lets you narrow searches (e.g., only show results from a specific category). \"Non-filterable\" metadata is returned with results but can\u2019t be used to filter.",
    choices: [
      {
        label: "Just the basics",
        description: "An ID and maybe a source URL \u2014 no filtering needed",
        configPatch: {
          avgKeyLengthBytes: 30,
          filterableMetadataBytes: 50,
          nonFilterableMetadataBytes: 0,
        },
      },
      {
        label: "A few filters",
        description: "Filter by category, date, or tenant \u2014 plus a snippet of source text returned with results",
        configPatch: {
          avgKeyLengthBytes: 30,
          filterableMetadataBytes: 200,
          nonFilterableMetadataBytes: 500,
        },
      },
      {
        label: "Rich metadata",
        description: "Many filter fields (tags, price ranges, permissions) plus full text or descriptions stored per vector",
        configPatch: {
          avgKeyLengthBytes: 50,
          filterableMetadataBytes: 500,
          nonFilterableMetadataBytes: 2000,
        },
      },
      {
        label: "I\u2019ll specify exact sizes",
        description: "Enter byte sizes for keys, filterable, and non-filterable metadata",
        configPatch: {},
        nextStepId: "custom-metadata",
      },
    ],
    getNextStepId: (config) =>
      config._lastChoice === "I\u2019ll specify exact sizes" ? "custom-metadata" : "data-freshness",
  },
  {
    id: "custom-metadata",
    type: "number",
    botMessage:
      "Let\u2019s size your metadata. The key is a unique string ID for each vector (e.g., \"doc-abc-chunk-12\" = 18 bytes). Filterable metadata is fields you query against. Non-filterable is extra payload returned with results.",
    helpText:
      "Example: a product vector might have key=\"prod-12345\" (10B), filterable: category + brand + price (~150B as JSON), non-filterable: product description (~500B).",
    numberFields: [
      {
        key: "avgKeyLengthBytes",
        label: "Key length",
        suffix: "bytes",
        placeholder: "e.g. 30",
        min: 1,
      },
      {
        key: "filterableMetadataBytes",
        label: "Filterable metadata",
        suffix: "bytes",
        placeholder: "e.g. 200",
        min: 0,
      },
      {
        key: "nonFilterableMetadataBytes",
        label: "Non-filterable metadata",
        suffix: "bytes",
        placeholder: "e.g. 500",
        min: 0,
      },
    ],
    getNextStepId: () => "data-freshness",
  },
  {
    id: "data-freshness",
    type: "choice",
    botMessage: "How often will your data change?",
    helpText:
      "This determines how many vectors are written (inserted or updated) each month. Writes are charged based on data uploaded.",
    choices: [
      {
        label: "Mostly static",
        description: "Loaded once, rarely updated \u2014 maybe a few hundred changes per month",
        configPatch: { monthlyVectorsWritten: 500 },
      },
      {
        label: "Regular updates",
        description: "New content added weekly, some items updated \u2014 ~10K writes/month",
        configPatch: { monthlyVectorsWritten: 10_000 },
      },
      {
        label: "Frequently changing",
        description: "Daily ingestion of new data, frequent updates \u2014 ~100K writes/month",
        configPatch: { monthlyVectorsWritten: 100_000 },
      },
      {
        label: "High-volume ingestion",
        description: "Continuous pipeline \u2014 500K+ writes/month",
        configPatch: { monthlyVectorsWritten: 500_000 },
      },
      {
        label: "I know the exact number",
        description: "Enter a specific write volume",
        configPatch: {},
        nextStepId: "custom-write-volume",
      },
    ],
    getNextStepId: (config) =>
      config._lastChoice === "I know the exact number" ? "custom-write-volume" : "query-pattern",
  },
  {
    id: "custom-write-volume",
    type: "number",
    botMessage: "How many vectors will be written (inserted or updated) per month?",
    helpText:
      "This covers both new data and updates to existing vectors. If you\u2019re doing a one-time bulk load, divide total vectors by the number of months you want to amortize over.",
    numberFields: [
      {
        key: "monthlyVectorsWritten",
        label: "Vectors written per month",
        suffix: "vectors/mo",
        placeholder: "e.g. 10000",
        min: 0,
      },
    ],
    getNextStepId: () => "query-pattern",
  },
  {
    id: "query-pattern",
    type: "choice",
    botMessage: "How much search traffic do you expect?",
    helpText:
      "Think about how your app is used. A single user search triggers one query. A chatbot message with RAG triggers 1\u20133 queries. Automated pipelines can generate thousands per hour.",
    choices: [
      {
        label: "Light \u2014 internal tool or prototype",
        description: "A handful of users, <10K queries/month",
        configPatch: { monthlyQueries: 10_000 },
      },
      {
        label: "Moderate \u2014 team or department use",
        description: "Dozens of users or a chatbot, ~100K\u2013500K queries/month",
        configPatch: { monthlyQueries: 500_000 },
      },
      {
        label: "High \u2014 customer-facing product",
        description: "Search bar, recommendations, or chatbot serving many users, ~1M\u20135M queries/month",
        configPatch: { monthlyQueries: 2_000_000 },
      },
      {
        label: "Very high \u2014 high-traffic application",
        description: "Millions of users or automated pipelines, 5M+ queries/month",
        configPatch: { monthlyQueries: 10_000_000 },
      },
      {
        label: "I know the exact number",
        description: "Enter a specific query volume",
        configPatch: {},
        nextStepId: "custom-query-volume",
      },
    ],
    getNextStepId: (config) =>
      config._lastChoice === "I know the exact number" ? "custom-query-volume" : "summary",
  },
  {
    id: "custom-query-volume",
    type: "number",
    botMessage: "How many queries do you expect per month?",
    helpText:
      "Reference: 10K/mo = ~14/hour, 500K/mo = ~700/hour, 5M/mo = ~7K/hour.",
    numberFields: [
      {
        key: "monthlyQueries",
        label: "Monthly queries",
        suffix: "queries/mo",
        placeholder: "e.g. 500000",
        min: 0,
      },
    ],
    getNextStepId: () => "summary",
  },
  {
    id: "summary",
    type: "info",
    botMessage:
      "All set! Your estimated costs are shown in the results panel. You can fine-tune any value by switching to the full configurator.",
    getNextStepId: () => null,
  },
];
