# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

**Vectors Wizard** is a Next.js 16 cost calculator for Amazon S3 Vectors. It estimates monthly costs based on storage, writes, queries, and embedding dimensions.

### Provider System

The calculator is built around a pluggable provider abstraction in `src/lib/providers/`:

- **`types.ts`** - Core interfaces: `PricingProvider<TConfig>`, `CostBreakdown`, `WizardStep`
- **`registry.ts`** - Provider registration (`registerProvider()`, `getProvider()`)
- **`s3-vectors/`** - S3 Vectors implementation with pricing logic, presets, and wizard steps

To add a new provider (e.g., Pinecone), implement `PricingProvider` and register it. The UI adapts automatically.

### State Management

Two custom hooks manage all state (no external libraries):

- **`useCalculator`** (`src/hooks/use-calculator.ts`) - Top-level state: config object, mode (landing/wizard/configurator), presets, import/export. Computes cost breakdown via `useMemo`.
- **`useWizard`** (`src/hooks/use-wizard.ts`) - Wizard flow state machine: conversation history, step tracking, branching logic, config patching.

### Three Interaction Modes

1. **Landing** - Initial view with mode selection
2. **Wizard** - Guided chatbot-style questionnaire with branching (`WizardChat.tsx`)
3. **Configurator** - Direct form controls for all parameters

### Component Layout

```
VectorCostCalculator (top-level, useClient)
├── CalculatorShell (layout orchestrator)
│   ├── ModeSelector / ConfigToolbar / PresetBar
│   ├── WizardChat OR Configurator (based on mode)
│   └── ResultsPanel (cost breakdown display)
```

### S3 Vectors Pricing Model

Rates are defined in `src/lib/providers/s3-vectors/pricing.ts`:
- Storage: $0.06/GB-month
- Write (PUT): $0.20/GB
- Query API: $2.50/1M calls
- Query Data: $0.004/TB (≤100K vectors), $0.002/TB (>100K vectors)

Cost calculation uses tiered/blended rates based on index size. Per-vector byte size is computed from dimensions, key length, and metadata.

## Design System

Uses Caylent brand design tokens in `globals.css`:
- Dark theme with cosmic background (gradients, noise texture, floating orbs)
- Color accents: Purple (#8555f0) for storage, Green (#cbefae) for writes, Blue (#5ba4f5) for queries
- Fonts: Roboto (body), Roboto Mono (numbers)

## Key Patterns

- **Config serialization**: `src/lib/config-serialization.ts` handles JSON import/export with version tracking
- **Real-time updates**: All cost calculations are reactive via `useMemo` on config changes
- **Type-safe config**: Each provider defines its own config interface; validation happens at import
