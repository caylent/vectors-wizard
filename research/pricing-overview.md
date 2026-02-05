# Vector Database Pricing Research

Research compiled: February 2026

## Summary Table

| Provider | Pricing Model | Min Cost/Month | Storage | Key Metric |
|----------|---------------|----------------|---------|------------|
| **S3 Vectors** | Usage-based | ~$0 | $0.06/GB | Query data processed |
| **OpenSearch Serverless** | OCU-hours | ~$350 | $0.024/GB | OCU @ $0.24/hr |
| **Pinecone Serverless** | Read/Write units | $50 | $0.33/GB | RU @ $16/M, WU @ $4/M |
| **Zilliz Cloud** | vCUs + storage | $0 (free tier) | $0.04/GB | vCU @ $4/M |
| **TurboPuffer** | Usage-based | $64 | ~$70/TB | Writes + Queries |
| **MongoDB Atlas** | Instance-based | $8 (Flex) | Included | Cluster tier |
| **Qdrant Cloud** | Resource-based | $0 (1GB free) | Bundled | CPU/RAM/Disk |
| **Weaviate Cloud** | Dimension-based | $45 | $0.255/GiB | Vector dims @ $0.014/M |

## Pricing Model Categories

### 1. Serverless / Usage-Based
- **S3 Vectors**: Pay for storage + writes + queries
- **Pinecone Serverless**: Pay for read/write units + storage
- **Zilliz Serverless**: Pay for vCUs (compute) + storage
- **TurboPuffer**: Pay for storage + writes + queries

### 2. Instance/Cluster-Based
- **MongoDB Atlas**: Pay for cluster tier (M10, M20, etc.)
- **OpenSearch Serverless**: Pay for OCUs (compute units)
- **Qdrant Cloud**: Pay for CPU/RAM/Disk allocation

### 3. Hybrid Models
- **Weaviate**: Vector dimensions + storage + backups
- **Zilliz Dedicated**: Per-million-vectors pricing

## Files in This Directory

- [pinecone.md](./pinecone.md) - Pinecone pricing details
- [opensearch.md](./opensearch.md) - Amazon OpenSearch Serverless pricing
- [zilliz-milvus.md](./zilliz-milvus.md) - Zilliz Cloud / Milvus pricing
- [turbopuffer.md](./turbopuffer.md) - TurboPuffer pricing
- [mongodb.md](./mongodb.md) - MongoDB Atlas pricing
- [qdrant.md](./qdrant.md) - Qdrant Cloud pricing
- [weaviate.md](./weaviate.md) - Weaviate Cloud pricing
