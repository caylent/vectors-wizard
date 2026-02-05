# MongoDB Atlas Pricing Research

Source: https://www.mongodb.com/pricing

## Key Point

**Vector Search is included with Atlas clusters** - no separate vector search pricing.
You pay for the cluster tier, and vector search capabilities come with it.

## Cluster Tiers

### Serverless / Flex

| Tier | Cost | Storage | Use Case |
|------|------|---------|----------|
| **M0 (Free)** | $0 | 512 MB | Learning/exploring |
| **Flex** | $8-30/mo | 5 GB | Dev/test with burst |

Flex pricing by ops/sec:
- 0-100 ops/sec: $8/mo
- 100-200 ops/sec: $15/mo
- 200-300 ops/sec: $21/mo
- 300-400 ops/sec: $26/mo
- 400-500 ops/sec: $30/mo

### Dedicated Clusters

| Tier | Storage | RAM | vCPU | Hourly | Monthly |
|------|---------|-----|------|--------|---------|
| M10 | 10-128 GB | 2 GB | 2 | $0.08 | ~$58 |
| M20 | 20-256 GB | 4 GB | 2 | $0.20 | ~$146 |
| M30 | 40-512 GB | 8 GB | 2 | $0.54 | ~$394 |
| M40 | 80 GB-1 TB | 16 GB | 4 | $1.04 | ~$759 |
| M50 | 160 GB-4 TB | 32 GB | 8 | $2.00 | ~$1,460 |
| M60 | 320 GB-4 TB | 64 GB | 16 | $3.95 | ~$2,884 |
| M80 | 750 GB-4 TB | 128 GB | 32 | $7.30 | ~$5,329 |

*Prices for AWS US East. Azure/GCP may vary slightly.*

## Vector Search Requirements

- Available on **M10+ dedicated clusters**
- Also available on Flex tier
- NOT available on M0 free tier
- No additional per-query or per-vector charges

## Calculator Inputs Needed

For a MongoDB provider, we'd need:
- Cluster tier selection (or auto-calculate based on needs)
- Storage required
- Ops/sec expected
- Whether vector search is needed

## Cost Formula

```
Monthly Cost = cluster_tier_hourly_rate × 730 hours
```

Or for Flex:
```
Monthly Cost = ops_sec_tier_rate
```

## Additional Services (Optional)

| Service | Rate |
|---------|------|
| Atlas Search (dedicated) | From $2/mo |
| Data Federation | Per data processed |
| Atlas SQL | $5/TB processed |
| Backup | Included with dedicated |

## Notes

- Vector search uses same indexes as regular MongoDB queries
- Supports approximate nearest neighbor (ANN) search
- Integrates with MongoDB aggregation pipeline
- Can combine vector search with traditional filters
- Auto-scaling available for dedicated tiers
- Multi-cloud support (AWS, Azure, GCP)
