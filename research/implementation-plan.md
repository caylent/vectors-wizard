# Provider Implementation Plan

## Priority Order (Recommended)

Based on pricing clarity and market relevance:

1. **Pinecone** - Clear serverless pricing, very popular
2. **OpenSearch Serverless** - AWS native, OCU-based
3. **Zilliz/Milvus** - Clear serverless + dedicated pricing
4. **Weaviate** - Unique dimension-based pricing
5. **TurboPuffer** - Usage-based, cost-focused
6. **MongoDB Atlas** - Instance-based, vector search included
7. **Qdrant** - Resource-based, needs calculator integration

## Implementation Template

Each provider needs:

```
src/lib/providers/{provider-name}/
├── index.ts          # Provider definition
├── pricing.ts        # Rates and calculation logic
├── presets.ts        # 3-4 quickstart templates
└── wizard-steps.ts   # Guided questionnaire
```

---

## 1. Pinecone

**Config Fields:**
- `numVectors` - Number of vectors stored
- `dimensions` - Vector dimensions (affects storage)
- `monthlyQueries` - Read units (queries)
- `monthlyUpserts` - Write units (inserts/updates)

**Cost Calculation:**
```typescript
const PRICING = {
  storage: { perGBMonth: 0.33 },
  readUnits: { perMillion: 16 },
  writeUnits: { perMillion: 4 },
  minimum: 50, // Standard plan
};

function calculateCosts(config) {
  const storageGB = (config.numVectors * config.dimensions * 4) / 1e9;
  const storage = storageGB * PRICING.storage.perGBMonth;
  const reads = (config.monthlyQueries / 1e6) * PRICING.readUnits.perMillion;
  const writes = (config.monthlyUpserts / 1e6) * PRICING.writeUnits.perMillion;
  return Math.max(PRICING.minimum, storage + reads + writes);
}
```

**Presets:**
- RAG Chatbot (100K vectors, moderate queries)
- Semantic Search (1M vectors, high queries)
- Recommendation Engine (10M vectors, batch writes)
- Development (10K vectors, low usage)

---

## 2. OpenSearch Serverless

**Config Fields:**
- `indexSizeGB` - Total index size
- `monthlyQueries` - Query volume
- `monthlyWrites` - Write volume
- `deploymentMode` - "production" | "dev-test"

**Cost Calculation:**
```typescript
const PRICING = {
  ocu: { perHour: 0.24 },
  storage: { perGBMonth: 0.024 },
  hoursPerMonth: 730,
};

function calculateCosts(config) {
  // Estimate OCUs based on workload
  const baseIndexingOCUs = config.deploymentMode === 'dev-test' ? 0.5 : 1;
  const baseSearchOCUs = config.deploymentMode === 'dev-test' ? 0.5 : 1;

  // Scale OCUs based on throughput (simplified)
  const indexingOCUs = Math.max(baseIndexingOCUs, estimateIndexingOCUs(config));
  const searchOCUs = Math.max(baseSearchOCUs, estimateSearchOCUs(config));

  const compute = (indexingOCUs + searchOCUs) * PRICING.ocu.perHour * PRICING.hoursPerMonth;
  const storage = config.indexSizeGB * PRICING.storage.perGBMonth;

  return compute + storage;
}
```

**Presets:**
- Dev/Test (small index, minimal OCUs)
- Production Small (10GB, 2 OCUs)
- Production Medium (100GB, 4 OCUs)
- Production Large (1TB, 8+ OCUs)

---

## 3. Zilliz Cloud (Serverless)

**Config Fields:**
- `numVectors` - Number of vectors
- `dimensions` - Vector dimensions
- `monthlyQueries` - vCU consumption (queries)
- `monthlyWrites` - vCU consumption (writes)

**Cost Calculation:**
```typescript
const PRICING = {
  vcu: { perMillion: 4 },
  storage: { perGBMonth: 0.04 },
};

function calculateCosts(config) {
  const storageGB = estimateStorage(config.numVectors, config.dimensions);
  const storage = storageGB * PRICING.storage.perGBMonth;

  // Estimate vCUs based on operations
  const queryVCUs = estimateQueryVCUs(config.monthlyQueries);
  const writeVCUs = estimateWriteVCUs(config.monthlyWrites);
  const compute = ((queryVCUs + writeVCUs) / 1e6) * PRICING.vcu.perMillion;

  return storage + compute;
}
```

**Presets:**
- Free Tier Demo (within 5GB/2.5M vCU limits)
- Startup (100K vectors, moderate usage)
- Growth (1M vectors, high queries)
- Scale (10M+ vectors, batch operations)

---

## 4. Weaviate

**Config Fields:**
- `numObjects` - Number of vectors
- `dimensions` - Vector dimensions
- `replicationFactor` - 1, 2, or 3
- `storageGiB` - Estimated storage
- `backupGiB` - Backup volume

**Cost Calculation:**
```typescript
const PRICING = {
  dimensions: { perMillion: 0.0139 },
  storage: { perGiB: 0.255 },
  backup: { perGiB: 0.0264 },
  minimum: 45,
};

function calculateCosts(config) {
  const dims = config.numObjects * config.dimensions * config.replicationFactor;
  const dimCost = (dims / 1e6) * PRICING.dimensions.perMillion;
  const storageCost = config.storageGiB * PRICING.storage.perGiB;
  const backupCost = config.backupGiB * PRICING.backup.perGiB;

  return Math.max(PRICING.minimum, dimCost + storageCost + backupCost);
}
```

---

## 5. TurboPuffer

**Config Fields:**
- `numVectors` - Number of vectors
- `dimensions` - Vector dimensions
- `monthlyWriteBytes` - Write volume
- `monthlyQueryBytes` - Query volume

**Cost Calculation:**
```typescript
const PRICING = {
  storage: { perTBMonth: 70 },
  minimum: 64, // Launch tier
};

function calculateCosts(config) {
  const storageTB = (config.numVectors * config.dimensions * 4) / 1e12;
  const storage = storageTB * PRICING.storage.perTBMonth;

  // Write and query costs (simplified - actual has discounts)
  const writes = estimateWriteCost(config.monthlyWriteBytes);
  const queries = estimateQueryCost(config.monthlyQueryBytes);

  return Math.max(PRICING.minimum, storage + writes + queries);
}
```

---

## 6. MongoDB Atlas

**Config Fields:**
- `clusterTier` - M10, M20, M30, etc.
- `storageGB` - Storage allocation
- `useVectorSearch` - boolean (for display purposes)

**Cost Calculation:**
```typescript
const PRICING = {
  tiers: {
    M10: { hourly: 0.08 },
    M20: { hourly: 0.20 },
    M30: { hourly: 0.54 },
    M40: { hourly: 1.04 },
    M50: { hourly: 2.00 },
  },
  hoursPerMonth: 730,
};

function calculateCosts(config) {
  const tier = PRICING.tiers[config.clusterTier];
  return tier.hourly * PRICING.hoursPerMonth;
}
```

---

## UI Considerations

### Provider Selector
Need to add a provider dropdown/selector to switch between databases.

### Dynamic Config Fields
Each provider has different config fields - the Configurator component already supports this via `provider.configFields`.

### Results Panel
Cost breakdown categories vary by provider - the `CostLineItem` type already handles this.

### Landing Page
Could show comparison table or let users select provider first.

---

## Data Sources

| Provider | Pricing Page | Calculator |
|----------|--------------|------------|
| Pinecone | pinecone.io/pricing | In-page |
| OpenSearch | aws.amazon.com/opensearch-service/pricing | AWS Calculator |
| Zilliz | zilliz.com/pricing | In-page |
| Weaviate | weaviate.io/pricing | In-page |
| TurboPuffer | turbopuffer.com/pricing | In-page |
| MongoDB | mongodb.com/pricing | mongodb.com/pricing/calculator |
| Qdrant | qdrant.tech/pricing | cloud.qdrant.io/calculator |
