import type { PricingProvider } from "./types";
import { s3VectorsProvider } from "./s3-vectors";
import { pineconeProvider } from "./pinecone";
import { opensearchProvider } from "./opensearch";
import { zillizProvider } from "./zilliz";
import { weaviateProvider } from "./weaviate";
import { turbopufferProvider } from "./turbopuffer";
import { mongodbProvider } from "./mongodb";
import { mongodbSelfhostedProvider } from "./mongodb-selfhosted";
import { milvusProvider } from "./milvus";

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

export function listProviders(): { id: string; name: string; description: string }[] {
  return Array.from(providers.values()).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }));
}

// Register built-in providers (order matters for display)
registerProvider(s3VectorsProvider);
registerProvider(pineconeProvider);
registerProvider(opensearchProvider);
registerProvider(zillizProvider);
registerProvider(weaviateProvider);
registerProvider(turbopufferProvider);
registerProvider(mongodbProvider);
registerProvider(mongodbSelfhostedProvider);
registerProvider(milvusProvider);
