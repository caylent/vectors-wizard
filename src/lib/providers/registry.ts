import type { PricingProvider } from "./types";
import { s3VectorsProvider } from "./s3-vectors";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers = new Map<string, PricingProvider<any>>();

export function registerProvider<T>(provider: PricingProvider<T>): void {
  providers.set(provider.id, provider);
}

export function getProvider<T = Record<string, number>>(
  id: string
): PricingProvider<T> | undefined {
  return providers.get(id) as PricingProvider<T> | undefined;
}

export function listProviders(): { id: string; name: string }[] {
  return Array.from(providers.values()).map((p) => ({
    id: p.id,
    name: p.name,
  }));
}

// Register built-in providers
registerProvider(s3VectorsProvider);
