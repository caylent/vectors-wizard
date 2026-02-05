# Weaviate Cloud Pricing Research

Source: https://weaviate.io/pricing

## Plans

| Plan | Min Cost | Deployment | Uptime SLA |
|------|----------|------------|------------|
| **Free Trial** | $0 (14 days) | Shared | - |
| **Flex** | $45/mo | Shared | 99.5% |
| **Premium** | $400/mo | Shared or Dedicated | Up to 99.95% |

## Pricing Dimensions

Weaviate charges for three things:

### 1. Vector Dimensions
Cost based on: objects × dimensions × replication factor

| Plan | Rate |
|------|------|
| Flex | From $0.0139/million dimensions |
| Premium | From $0.00975/million dimensions |

### 2. Storage
Total disk for indexes, metadata, and database state.

| Plan | Rate |
|------|------|
| Flex | From $0.255/GiB |
| Premium | From $0.31875/GiB |

### 3. Backups
Snapshot volume retained over time.

| Plan | Rate | Retention |
|------|------|-----------|
| Flex | From $0.0264/GiB | 7 days |
| Premium | From $0.033/GiB | 45 days |

## Additional Services

| Service | Rate |
|---------|------|
| Embeddings | $0.025-0.065/M tokens |
| Query Agent | $30/mo (4K requests included) |
| Data Transfer | Free (promotional) |

## Calculator Inputs Needed

For a Weaviate provider, we'd need:
- Number of objects (vectors)
- Vector dimensions
- Replication factor
- Estimated storage needs
- Backup requirements
- Whether using embeddings service

## Cost Formula

```
Monthly Cost =
  (objects × dimensions × replication × $0.0139/M) +  // Vector dims
  (storage_GiB × $0.255) +                            // Storage
  (backup_GiB × $0.0264) +                            // Backups
  max($45, usage)                                     // Minimum (Flex)
```

## Cost Optimization

Weaviate notes savings reflected for:
- Using flat indexes (vs HNSW)
- Enabling compression
- Running in lower-cost regions

## Notes

- Pricing model updated October 2025
- Regional pricing variations exist
- Pay-as-you-go or annual commitment options
- Dedicated deployment available on Premium
- All core database features included in Flex
- Built-in RBAC included
- AI-native services (Embeddings, Agents) included
