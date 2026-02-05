# Amazon OpenSearch Serverless Pricing Research

Source: https://aws.amazon.com/opensearch-service/pricing/

## Pricing Model

OpenSearch Serverless charges for:
1. **Compute** (OCUs - OpenSearch Compute Units)
2. **Storage** (S3-based)

## OCU Pricing

| Component | Rate (US East) |
|-----------|----------------|
| Indexing OCU | $0.24/hour |
| Search OCU | $0.24/hour |

**What's in an OCU:**
- 6 GB RAM
- Corresponding vCPU
- GP3 storage (hot data)
- Data transfer to S3

## Storage Pricing

| Component | Rate |
|-----------|------|
| S3 Storage | $0.024/GB/month |

## Minimum Requirements

### Standard Deployment
- Minimum 2 OCUs for first collection
  - 1 OCU for indexing (with standby)
  - 1 OCU for search (with replica)
- **Minimum cost: ~$350/month** (2 OCUs × $0.24 × 730 hours)

### Dev/Test Deployment
- Minimum 0.5 OCU each for indexing and search
- No standby/replica (less redundancy)
- **Minimum cost: ~$175/month**

## Vector Search Notes

- Vector search collections CANNOT share OCUs with text search collections
- Separate OCU allocation required for vector workloads
- GPU acceleration available for faster indexing (separate pricing)

## Calculator Inputs Needed

For an OpenSearch Serverless provider, we'd need:
- Index size (GB)
- Query volume (affects search OCUs)
- Write volume (affects indexing OCUs)
- Dev/Test vs Production mode

## Cost Formula

```
Monthly Cost =
  (indexing_OCUs × $0.24 × 730) +  // Indexing compute
  (search_OCUs × $0.24 × 730) +    // Search compute
  (storage_GB × $0.024)            // S3 storage
```

## OCU Scaling

- OCUs auto-scale based on workload
- Billed per-second with hourly aggregation
- Can set max OCU limits to control costs

## Notes

- Billing granularity is per-second
- No upfront costs or long-term commitments
- Cross-region replication adds costs
- Data transfer out charged separately
