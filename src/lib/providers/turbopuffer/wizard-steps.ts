import type { WizardStep } from "../types";

export const TURBOPUFFER_WIZARD_STEPS: WizardStep[] = [
  {
    id: "plan",
    type: "choice",
    botMessage: "Which TurboPuffer plan are you considering?",
    helpText: "Each plan has a minimum monthly spend and different feature sets.",
    choices: [
      {
        label: "Launch ($64/mo min)",
        description: "Multi-tenancy, community support",
        configPatch: { plan: 0 },
      },
      {
        label: "Scale ($256/mo min)",
        description: "+ HIPAA BAA, SSO, private Slack",
        configPatch: { plan: 1 },
      },
      {
        label: "Enterprise ($4,096/mo min)",
        description: "+ Single-tenancy, BYOC, 24/7 SLA",
        configPatch: { plan: 2 },
      },
    ],
    getNextStepId: () => "dataset-size",
  },
  {
    id: "dataset-size",
    type: "choice",
    botMessage: "How large is your vector dataset?",
    helpText: "TurboPuffer charges based on logical bytes stored, not physical storage.",
    choices: [
      {
        label: "Small — under 1M vectors",
        description: "~1-10 GB storage",
        configPatch: { numVectors: 500_000, dimensions: 1024, metadataBytes: 150 },
      },
      {
        label: "Medium — 1M–10M vectors",
        description: "~10-100 GB storage",
        configPatch: { numVectors: 5_000_000, dimensions: 1024, metadataBytes: 100 },
      },
      {
        label: "Large — 10M–100M vectors",
        description: "~100 GB–1 TB storage",
        configPatch: { numVectors: 50_000_000, dimensions: 768, metadataBytes: 100 },
      },
      {
        label: "Very large — 100M+ vectors",
        description: "1+ TB storage",
        configPatch: { numVectors: 200_000_000, dimensions: 768, metadataBytes: 100 },
      },
    ],
    getNextStepId: () => "write-volume",
  },
  {
    id: "write-volume",
    type: "choice",
    botMessage: "How much data will you write per month?",
    helpText: "TurboPuffer charges based on bytes written. Batch writes get up to 50% discount.",
    choices: [
      {
        label: "Light — under 10 GB/month",
        description: "Mostly static data",
        configPatch: { monthlyWriteGB: 5 },
      },
      {
        label: "Moderate — 10-100 GB/month",
        description: "Regular updates",
        configPatch: { monthlyWriteGB: 50 },
      },
      {
        label: "Heavy — 100 GB–1 TB/month",
        description: "Frequent ingestion",
        configPatch: { monthlyWriteGB: 300 },
      },
      {
        label: "Very heavy — 1+ TB/month",
        description: "Continuous pipeline",
        configPatch: { monthlyWriteGB: 1500 },
      },
    ],
    getNextStepId: () => "query-volume",
  },
  {
    id: "query-volume",
    type: "choice",
    botMessage: "How much data will you query per month?",
    helpText: "Based on data scanned during queries. Volume discounts apply beyond 32GB per query.",
    choices: [
      {
        label: "Light — under 50 GB/month",
        description: "Low query volume",
        configPatch: { monthlyQueryGB: 25 },
      },
      {
        label: "Moderate — 50-500 GB/month",
        description: "Production workload",
        configPatch: { monthlyQueryGB: 200 },
      },
      {
        label: "Heavy — 500 GB–5 TB/month",
        description: "High-traffic app",
        configPatch: { monthlyQueryGB: 1500 },
      },
      {
        label: "Very heavy — 5+ TB/month",
        description: "Large-scale production",
        configPatch: { monthlyQueryGB: 8000 },
      },
    ],
    getNextStepId: () => "summary",
  },
  {
    id: "summary",
    type: "info",
    botMessage:
      "All set! TurboPuffer is designed for cost-efficiency at scale with S3-based storage (~$70/TB vs $600+/TB for competitors).",
    getNextStepId: () => null,
  },
];
