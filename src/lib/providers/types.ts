// Provider abstraction types for vector database cost calculators

export interface CostLineItem {
  category: string;
  label: string;
  amount: number;
  details: Record<string, string | number>;
  color: string;
}

export interface ProviderCostBreakdown {
  lineItems: CostLineItem[];
  totalMonthlyCost: number;
}

export interface WizardChoice {
  label: string;
  description?: string;
  configPatch: Record<string, number | string>;
  nextStepId?: string;
}

export interface WizardNumberField {
  key: string;
  label: string;
  placeholder?: string;
  suffix?: string;
  min?: number;
  max?: number;
}

export interface WizardStep {
  id: string;
  type: "choice" | "number" | "info";
  botMessage: string;
  helpText?: string;
  choices?: WizardChoice[];
  numberFields?: WizardNumberField[];
  getNextStepId?: (config: Record<string, unknown>) => string | null;
}

export interface ProviderConfigField {
  key: string;
  label: string;
  tooltip: string;
  type: "number" | "select";
  section: string;
  suffix?: string;
  min?: number;
  options?: { value: number; label: string }[];
}

export interface ProviderPreset {
  name: string;
  description: string;
  config: Record<string, number>;
}

/** Standard cross-provider config shape used for provider comparison. */
export interface UniversalConfig {
  numVectors: number;
  dimensions: number;
  metadataBytes: number;
  monthlyQueries: number;
  monthlyWrites: number;
  embeddingCostPerMTokens: number;
  avgTokensPerVector: number;
  avgTokensPerQuery: number;
}

export interface PricingProvider<TConfig = Record<string, number>> {
  id: string;
  name: string;
  description: string;
  regionLabel: string;
  configFields: ProviderConfigField[];
  defaultConfig: TConfig;
  calculateCosts: (config: TConfig) => ProviderCostBreakdown;
  presets: ProviderPreset[];
  wizardSteps: WizardStep[];
  entryStepId: string;
  pricingReference: { label: string; value: string }[];
  pricingDisclaimer: string;

  /** Extract a universal config from this provider's config (for cross-provider comparison). */
  toUniversalConfig?: (config: Record<string, number>) => UniversalConfig;
  /** Translate a universal config into this provider's numeric config (for cross-provider comparison). */
  fromUniversalConfig?: (universal: UniversalConfig) => Record<string, number>;
}
