# Pinecone Pricing Research

Source: https://www.pinecone.io/pricing/

## Plans

| Plan | Min Commitment | Storage | Read Units | Write Units |
|------|---------------|---------|------------|-------------|
| **Starter** | Free | 2 GB | 1M/mo | 2M/mo |
| **Standard** | $50/mo | Unlimited | $16/M | $4/M |
| **Enterprise** | $500/mo | Unlimited | $24/M | $6/M |
| **BYOC** | Custom | Custom | Custom | Custom |

## Serverless Pricing (Standard Plan)

| Component | Rate |
|-----------|------|
| Storage | $0.33/GB/month |
| Read Units | $16 per million |
| Write Units | $4 per million |

## What Counts as Read/Write Units?

- **Read Unit**: One query against the index
- **Write Unit**: One upsert (insert/update) operation

## Additional Services

| Service | Rate |
|---------|------|
| Assistant Storage | $3/GB/month |
| Assistant Input Tokens | $8/M tokens |
| Assistant Output Tokens | $15/M tokens |
| Inference Embeddings | $0.08-0.16/M tokens |
| Reranking | $2/1K requests |

## Calculator Inputs Needed

For a Pinecone provider, we'd need:
- Number of vectors stored
- Vector dimensions (affects storage)
- Monthly queries (read units)
- Monthly upserts (write units)
- Whether using embeddings/reranking (optional)

## Cost Formula

```
Monthly Cost =
  (vectors × dimensions × 4 bytes / 1GB × $0.33) +  // Storage
  (queries / 1M × $16) +                             // Reads
  (upserts / 1M × $4) +                              // Writes
  max($50, usage)                                    // Minimum
```

## Notes

- Storage calculated as: vectors × dimensions × 4 bytes (float32)
- Metadata adds to storage but exact overhead unclear
- Free tier has hard limits, not just throttling
- Standard 3-week trial includes $300 credits
