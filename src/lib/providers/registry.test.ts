import { describe, it, expect } from 'vitest';
import { getProvider, listProviders } from './registry';

describe('registry', () => {
  describe('listProviders', () => {
    it('should return all registered providers', () => {
      const providers = listProviders();
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should include all expected providers', () => {
      const providers = listProviders();
      const ids = providers.map((p) => p.id);

      expect(ids).toContain('s3-vectors');
      expect(ids).toContain('pinecone');
      expect(ids).toContain('opensearch');
      expect(ids).toContain('zilliz');
      expect(ids).toContain('weaviate');
      expect(ids).toContain('turbopuffer');
      expect(ids).toContain('mongodb');
      expect(ids).toContain('mongodb-selfhosted');
      expect(ids).toContain('milvus');
    });

    it('should have name and description for each provider', () => {
      const providers = listProviders();
      for (const provider of providers) {
        expect(provider.name).toBeTruthy();
        expect(provider.description).toBeTruthy();
      }
    });
  });

  describe('getProvider', () => {
    it('should return provider by ID', () => {
      const provider = getProvider('pinecone');
      expect(provider).toBeDefined();
      expect(provider!.id).toBe('pinecone');
      expect(provider!.name).toBe('Pinecone');
    });

    it('should return undefined for unknown provider', () => {
      const provider = getProvider('nonexistent');
      expect(provider).toBeUndefined();
    });

    it('should return provider with all required fields', () => {
      const provider = getProvider('s3-vectors');
      expect(provider).toBeDefined();
      expect(provider!.id).toBe('s3-vectors');
      expect(provider!.name).toBeTruthy();
      expect(provider!.description).toBeTruthy();
      expect(provider!.regionLabel).toBeTruthy();
      expect(provider!.configFields).toBeDefined();
      expect(provider!.defaultConfig).toBeDefined();
      expect(typeof provider!.calculateCosts).toBe('function');
      expect(provider!.presets.length).toBeGreaterThan(0);
      expect(provider!.wizardSteps.length).toBeGreaterThan(0);
      expect(provider!.entryStepId).toBeTruthy();
      expect(provider!.pricingReference.length).toBeGreaterThan(0);
      expect(provider!.pricingDisclaimer).toBeTruthy();
    });
  });
});
