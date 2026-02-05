# TurboPuffer Pricing Research

Source: https://turbopuffer.com/pricing

## Plans

| Plan | Min Spend | Features |
|------|-----------|----------|
| **Launch** | $64/mo | Multi-tenancy, community support |
| **Scale** | $256/mo | + HIPAA BAA, SSO, private Slack |
| **Enterprise** | $4,096/mo | + Single-tenancy, BYOC, 24/7 SLA, 99.95% uptime |

Note: Enterprise has 35% usage premium on top of base rates.

## Usage-Based Pricing

### Storage
- Billed on **logical bytes** (your data), not physical storage
- Vector dimensions: 4 bytes per dimension (f32) or 2 bytes (f16)
- Rate: ~$70/TB/month (vs $600-1600/TB for competitors)

### Writes
- Minimum 10 KB per write
- Batch discounts up to 50% (sliding scale, ~3.1 MB threshold)
- Non-indexed attributes: 50% discount

### Queries
- Based on data queried + returned data
- Minimum 256 MB per namespace per query
- 80% discount on data beyond 32 GB within single namespace per query

## Cost Comparison (from TurboPuffer)

| Storage Type | Cost |
|--------------|------|
| TurboPuffer (S3 + SSD Cache) | $70/TB/month |
| Traditional (3x SSD) | $600/TB/month |
| Incumbent DBs (RAM + 3x SSD) | $1,600/TB/month |

## Calculator Inputs Needed

For a TurboPuffer provider, we'd need:
- Number of vectors
- Vector dimensions
- Metadata size per vector
- Monthly write volume
- Monthly query volume
- Average query scope (namespace size)

## Cost Formula (Approximate)

```
Monthly Cost =
  max($64, usage_cost)  // Minimum spend

Where usage_cost =
  (storage_bytes × $0.07/GB) +      // Storage
  (write_bytes × write_rate) +       // Writes (with batch discounts)
  (query_data × query_rate)          // Queries (with volume discounts)
```

## Architecture Notes

- Built on object storage (S3) - enables low costs
- SSD cache for hot data
- Designed for cost-efficiency at scale
- 10x-100x cheaper than alternatives (claimed)

## Notes

- Pricing calculator available on website
- Minimum spend ensures support quality
- All database features available across tiers
- CMEK only on Enterprise tier
