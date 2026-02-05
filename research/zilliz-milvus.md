# Zilliz Cloud / Milvus Pricing Research

Source: https://zilliz.com/pricing

## Plans Overview

| Plan | Cost | Features |
|------|------|----------|
| **Free** | $0/mo | 5 GB storage, 2.5M vCUs, 5 collections |
| **Standard Serverless** | From $0/mo | Core APIs, backup/restore, encryption |
| **Standard Dedicated** | From $99/mo | Same as serverless, dedicated resources |
| **Enterprise** | From $155/mo | 99.95% SLA, SSO, RBAC, multi-replica |
| **Business Critical** | Contact sales | Global clusters, CMEK, HIPAA |

## Serverless Pricing

| Component | Rate |
|-----------|------|
| vCUs (Virtual Compute Units) | $4 per million |
| Storage | $0.04/GB/month (as of Jan 2026) |

**What are vCUs?**
- Measure of compute consumption for read/write operations
- Different operations consume different vCU amounts

## Dedicated Cluster Pricing

| Type | Rate | Vector Capacity (768d) |
|------|------|------------------------|
| Performance-optimized | From $65/M vectors/mo | 1.5M vectors |
| Capacity-optimized | From $20/M vectors/mo | 5M vectors |
| Tiered-storage | From $7/M vectors/mo | 20M vectors |

## Free Tier Details

- 5 GB storage
- 2.5M vCUs per month
- Up to 5 collections
- No credit card required

## Calculator Inputs Needed

For a Zilliz provider, we'd need:
- Number of vectors
- Vector dimensions
- Monthly queries (vCU consumption)
- Monthly writes (vCU consumption)
- Serverless vs Dedicated choice

## Cost Formula (Serverless)

```
Monthly Cost =
  (storage_GB × $0.04) +           // Storage
  (total_vCUs / 1M × $4)           // Compute
```

## Cost Formula (Dedicated)

```
Monthly Cost =
  (vectors / 1M × rate_per_million)  // Based on cluster type
```

## Notes

- Storage pricing standardized across AWS, Azure, GCP as of Jan 2026
- 87% storage cost reduction with new tiered storage system
- Milvus open-source is free (Apache 2.0 license)
- $200 free credits for new users
- 30-day free trial available
