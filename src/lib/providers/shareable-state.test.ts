import { describe, it, expect } from 'vitest';
import {
  encodeShareableState,
  decodeShareableState,
  createShareableUrl,
} from './shareable-state';

describe('shareable-state', () => {
  describe('encodeShareableState', () => {
    it('should encode provider and config to base64', () => {
      const encoded = encodeShareableState('pinecone', { numVectors: 100000 });
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should produce URL-safe base64 (no +, /, =)', () => {
      const encoded = encodeShareableState('s3-vectors', {
        numVectors: 1000000,
        dimensions: 1536,
        monthlyQueries: 500000,
      });
      expect(encoded).not.toMatch(/[+/=]/);
    });
  });

  describe('decodeShareableState', () => {
    it('should decode back to original values', () => {
      const original = {
        numVectors: 100000,
        dimensions: 1536,
        metadataBytes: 200,
      };
      const encoded = encodeShareableState('pinecone', original);
      const decoded = decodeShareableState(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded!.providerId).toBe('pinecone');
      expect(decoded!.config).toEqual(original);
    });

    it('should return null for invalid base64', () => {
      const result = decodeShareableState('not-valid-base64!!!');
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      // Valid base64 but not valid JSON
      const encoded = Buffer.from('not json').toString('base64');
      const result = decodeShareableState(encoded);
      expect(result).toBeNull();
    });

    it('should return null for wrong version', () => {
      const wrongVersion = { v: 99, p: 'test', c: {} };
      const encoded = Buffer.from(JSON.stringify(wrongVersion)).toString('base64');
      const result = decodeShareableState(encoded);
      expect(result).toBeNull();
    });

    it('should strip non-number config values', () => {
      const malicious = { v: 1, p: 'pinecone', c: { numVectors: 100, bad: 'string', arr: [1, 2] } };
      const encoded = Buffer.from(JSON.stringify(malicious)).toString('base64');
      const result = decodeShareableState(encoded);
      expect(result).not.toBeNull();
      expect(result!.config).toEqual({ numVectors: 100 });
      expect(result!.config).not.toHaveProperty('bad');
      expect(result!.config).not.toHaveProperty('arr');
    });

    it('should strip NaN and Infinity values', () => {
      // NaN and Infinity can't be represented in JSON, so we test null instead
      const withNull = { v: 1, p: 'pinecone', c: { good: 42, bad: null } };
      const encoded = Buffer.from(JSON.stringify(withNull)).toString('base64');
      const result = decodeShareableState(encoded);
      expect(result).not.toBeNull();
      expect(result!.config).toEqual({ good: 42 });
    });

    it('should return null when config is null', () => {
      const bad = { v: 1, p: 'pinecone', c: null };
      const encoded = Buffer.from(JSON.stringify(bad)).toString('base64');
      const result = decodeShareableState(encoded);
      expect(result).toBeNull();
    });
  });

  describe('roundtrip', () => {
    it('should handle complex configs', () => {
      const config = {
        numVectors: 10000000,
        dimensions: 3072,
        avgKeyLengthBytes: 30,
        filterableMetadataBytes: 200,
        nonFilterableMetadataBytes: 500,
        monthlyQueries: 5000000,
        monthlyVectorsWritten: 100000,
        embeddingCostPerMTokens: 0.14,
        avgTokensPerVector: 256,
        avgTokensPerQuery: 25,
      };

      const encoded = encodeShareableState('s3-vectors', config);
      const decoded = decodeShareableState(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded!.providerId).toBe('s3-vectors');
      expect(decoded!.config).toEqual(config);
    });

    it('should handle all provider IDs', () => {
      const providers = [
        's3-vectors',
        'pinecone',
        'opensearch',
        'zilliz',
        'weaviate',
        'turbopuffer',
        'mongodb',
        'mongodb-selfhosted',
        'milvus',
      ];

      for (const providerId of providers) {
        const encoded = encodeShareableState(providerId, { test: 123 });
        const decoded = decodeShareableState(encoded);
        expect(decoded!.providerId).toBe(providerId);
      }
    });
  });

  describe('createShareableUrl', () => {
    it('should create a valid URL with state param', () => {
      const url = createShareableUrl(
        'https://example.com',
        'pinecone',
        { numVectors: 100000 }
      );

      expect(url).toContain('https://example.com');
      expect(url).toContain('?s=');
    });
  });
});
