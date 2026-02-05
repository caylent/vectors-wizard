# Vectors Wizard

A cost calculator for Amazon S3 Vectors that helps estimate monthly operational costs for vector workloads.

## Features

- **Guided Wizard** - Interactive questionnaire that walks through use case, embedding model, and workload parameters
- **Manual Configurator** - Direct control over all pricing inputs for advanced users
- **Quickstart Presets** - Pre-configured templates for common use cases (RAG chatbot, product search, knowledge base, image similarity)
- **Real-time Cost Breakdown** - Itemized costs for storage, writes, queries, and embeddings
- **Import/Export** - Save and share configurations as JSON

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How It Works

The calculator estimates costs across four dimensions:

| Component | What it measures |
|-----------|------------------|
| **Storage** | Monthly cost to store vectors (based on count, dimensions, metadata) |
| **Writes** | Cost to ingest/update vectors |
| **Queries** | API call costs + data scanned per query |
| **Embeddings** | Token costs for your embedding model (optional) |

## Architecture

Built with Next.js 16, React 19, and Tailwind CSS.

The core is a **provider abstraction** (`src/lib/providers/`) that makes it easy to add calculators for other vector databases. Each provider defines:
- Pricing rates and calculation logic
- Configuration fields
- Wizard steps and presets

State is managed via two hooks:
- `useCalculator` - Config, mode switching, cost computation
- `useWizard` - Conversation flow and step progression

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
```
