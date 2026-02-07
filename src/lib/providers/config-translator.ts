// Translates a "universal" config to provider-specific configs
// This allows comparing costs across providers with different pricing models

import type { UniversalConfig } from "./types";
import { getProvider, listProviders } from "./registry";

// Re-export for consumers
export type { UniversalConfig } from "./types";

/** Fallback when a provider doesn't implement toUniversalConfig. */
const DEFAULT_UNIVERSAL: UniversalConfig = {
  numVectors: 100_000,
  dimensions: 1536,
  metadataBytes: 200,
  monthlyQueries: 500_000,
  monthlyWrites: 50_000,
  embeddingCostPerMTokens: 0,
  avgTokensPerVector: 256,
  avgTokensPerQuery: 25,
};

// Extract universal config from any provider's config
export function extractUniversalConfig(providerId: string, config: Record<string, number>): UniversalConfig {
  const provider = getProvider(providerId);
  if (provider?.toUniversalConfig) {
    return provider.toUniversalConfig(config);
  }
  return DEFAULT_UNIVERSAL;
}

// Translate universal config to a specific provider's config
export function translateToProvider(
  targetProviderId: string,
  universal: UniversalConfig
): Record<string, number> {
  const provider = getProvider(targetProviderId);
  if (provider?.fromUniversalConfig) {
    return provider.fromUniversalConfig(universal);
  }
  return {};
}

// Calculate costs for all providers based on a universal config
export interface ProviderComparison {
  providerId: string;
  name: string;
  description: string;
  monthlyCost: number;
  translatedConfig: Record<string, number>;
  isApplicable: boolean;
  notes?: string;
}

export function compareAllProviders(universal: UniversalConfig): ProviderComparison[] {
  const providers = listProviders();
  const results: ProviderComparison[] = [];

  for (const { id, name, description } of providers) {
    const provider = getProvider(id);
    if (!provider) continue;

    try {
      const translatedConfig = translateToProvider(id, universal);
      const costs = provider.calculateCosts(translatedConfig);

      results.push({
        providerId: id,
        name,
        description,
        monthlyCost: costs.totalMonthlyCost,
        translatedConfig,
        isApplicable: true,
      });
    } catch (error) {
      console.warn(`[compareAllProviders] Failed to calculate costs for "${id}":`, error);
      results.push({
        providerId: id,
        name,
        description,
        monthlyCost: 0,
        translatedConfig: {},
        isApplicable: false,
        notes: `Unable to estimate: ${error instanceof Error ? error.message : "unknown error"}`,
      });
    }
  }

  // Sort by cost (cheapest first)
  return results.sort((a, b) => {
    if (!a.isApplicable) return 1;
    if (!b.isApplicable) return -1;
    return a.monthlyCost - b.monthlyCost;
  });
}
