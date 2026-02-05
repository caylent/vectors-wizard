# Qdrant Cloud Pricing Research

Source: https://qdrant.tech/pricing/

## Plans

| Plan | Cost | Features |
|------|------|----------|
| **Free** | $0 | 1 GB cluster, forever free |
| **Managed Cloud** | Usage-based | Horizontal/vertical scaling, HA, backups |
| **Hybrid Cloud** | Custom | Your infra + Qdrant management |
| **Private Cloud** | Custom | Full on-premise deployment |

## Pricing Model

Qdrant Cloud pricing is based on **resource allocation**:
- CPU cores
- RAM
- Disk storage

Pricing scales with cluster configuration. Exact rates calculated via their pricing calculator.

## Starting Price

- **Managed Cloud**: From $0.014/hour for hybrid cloud deployments
- **Free tier**: 1 GB forever free, no credit card required

## What's Included

All tiers include:
- Horizontal and vertical scaling
- Central monitoring
- High availability with automatic failover
- Backup and disaster recovery
- Zero-downtime upgrades
- Data replication across nodes

## Calculator Inputs Needed

For a Qdrant provider, we'd need:
- Number of vectors
- Vector dimensions
- Desired RAM allocation
- Desired CPU allocation
- Storage requirements
- High availability requirements

## Cost Formula (Approximate)

```
Monthly Cost =
  (cluster_config_hourly_rate × 730 hours)

Where cluster_config depends on:
  - RAM GB
  - CPU cores
  - Storage GB
  - Replication factor
```

## Resource Estimation

Qdrant provides guidelines for sizing:
- Vectors require: dimensions × 4 bytes (float32) + overhead
- RAM should fit frequently accessed vectors
- Storage for full dataset + indexes

## Notes

- Pricing bundled (not itemized by storage/compute)
- Calculator at: cloud.qdrant.io/calculator
- Payment via credit card or cloud marketplace (AWS, GCP, Azure)
- Billed monthly for previous month's usage
- No price difference between payment methods
- Backup storage may incur additional charges
- Premium support available as upgrade
