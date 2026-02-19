# Visualizer Improvement Plan

## Current State Assessment

### What works
- Algorithmically correct: layer assignment uses proper probabilistic formula, search animation implements correct greedy descent + beam search
- Visually polished with GSAP animations, Bezier edges, concentric sphere metaphor
- Interactive parameter controls (M 2-48, efConstruction 16-512, efSearch 4-200, vector count 1K-10M) with real-time metric updates
- IVF visualization with k-means clustering, centroid octahedrons, nprobe highlighting
- Serves as an effective "wow" piece for marketing/first impressions

### What doesn't work
- **3D occlusion hides graph topology** — the most important thing (which node connects to which, how search navigates) is the hardest thing to see
- **Low data-ink ratio (Tufte)** — breathing animations, icosahedron wireframes, cosmic background are decoration rather than data
- **Cambridge Intelligence Rule 3: "Avoid 3D"** — 3D graphs suffer from occlusion, are hard to navigate, and make edge tracing nearly impossible
- **No educational narration** — the animation plays but doesn't explain what's happening at each step
- **No parameter comparison** — can't see ef=10 vs ef=100 side by side to understand the tradeoff
- **No exact vs approximate comparison** — the core concept of ANN search isn't demonstrated

### Industry comparison
- Zilliz's Feder tool, cfu288's visual guide, and Pinecone's docs all use **2D layered views** with edges traceable and search paths unambiguous
- The 3D sphere approach is unique but prioritizes aesthetics over comprehension

---

## Proposed Architecture: Three Modes

### Mode 1: "Hero" View (existing, keep as-is)
The 3D concentric sphere visualization. Keep as default/landing view — it communicates scale and hierarchy at a glance. Think of it as the "cover photo" that draws people in.

**No changes needed** — it already serves its purpose as a visual impression piece.

### Mode 2: "2D Analysis" View (new, high priority)
A flat, layered view where each HNSW layer is rendered as a horizontal band or concentric 2D rings. Edges are visible and traceable. Search animation plays as a clear, followable path.

**Key design decisions:**
- **Layout option A: Horizontal rows** — layers stacked top-to-bottom (like cfu288's visual guide, Pinecone's docs). Natural "descent" metaphor. Each layer is a force-directed 2D graph.
- **Layout option B: Concentric 2D rings** — top-down projection of the existing sphere metaphor. Inner ring = sparse top layer, outer ring = dense base layer. Preserves visual continuity with the 3D view.

**Must-haves:**
- Traceable edges (no occlusion)
- Clear search path with step-by-step playback (play/pause/step controls)
- Layer indicator showing which layer is currently active during search
- Color-coded node states: unvisited (dim), current (bright/pulsing), candidate queue (amber), explored (teal), result (green)
- Step counter: "Explored: 23/ef=40"

**Nice-to-haves:**
- Text narration sidebar: "Layer 3: Starting at entry point → greedy search..." / "Layer 0: Beam search with ef=40"
- Summary overlay after animation: "Layers traversed: 4, Total nodes explored: 27"
- Convex hull around candidate frontier during beam search

### Mode 3: "Compare" View (new, medium priority)
Small multiples — Tufte's most powerful technique applied to HNSW parameter comparison.

**Comparison types:**
1. **ef comparison**: 3-4 panels showing the same query with efSearch = 10, 40, 100, 200. Users see explored region grow.
2. **M comparison**: Same dataset with M=4, M=16, M=48 side by side. Density difference is instantly apparent.
3. **Layer decomposition**: Each layer as its own panel at the same scale. Sparse → dense progression without 3D nesting.
4. **Exact vs approximate**: Brute-force overlay showing what the approximate search missed — the single most powerful educational visualization.

---

## Implementation Details

### 2D Layout Algorithm
- Use force-directed graph layout (d3-force or custom) for each layer
- Nodes positioned within layer bands, connected by straight or gently curved edges
- Multi-layer nodes get vertical "pillar" connections (like the existing 3D implementation)
- Canvas or SVG rendering (SVG for interactivity, Canvas for performance at scale)

### Search Animation Improvements
The existing `HNSWSearchAnimation.tsx` has correct algorithm logic. Enhance with:

1. **Phase indicators**: Visual/text distinction between "Phase 1: Greedy Descent" and "Phase 2: Beam Search"
2. **Playback controls**: Play, Pause, Step Forward, Step Back, Speed slider
3. **Exploration counter**: `exploredCount / efSearch` as a progress bar
4. **Path history**: Keep previous path dimmed so full trajectory is visible
5. **Timing**: Keep 100-200ms per upper-layer step, 35ms per layer-0 step

### Parameter Sparklines (low effort, high value)
Tiny inline charts embedded next to parameter sliders:
- Next to M slider: recall-vs-M curve with dot at current value
- Next to efSearch slider: explored-nodes-count vs efSearch
- Next to nprobe slider: recall-vs-nprobe curve
- In resources panel: memory-vs-M sparkline

### Performance Considerations
- Current approach uses individual `<mesh>` per node — will hit draw-call limits above ~500 nodes
- Switch to **InstancedMesh** for 3D view (React Three Fiber supports this)
- For 2D view, consider Canvas 2D or WebGL for rendering large graphs
- Debounce parameter changes that trigger full re-layout

---

## Color System

### Node states during search
| State | Color | Usage |
|-------|-------|-------|
| Unvisited | `rgba(255,255,255,0.15)` | Background nodes |
| Current | `#fbbf24` (amber, pulsing) | Active search position |
| Candidate | `#f59e0b` (warm amber) | In candidate queue |
| Explored | `#5ba4f5` (blue) | Already visited |
| Result/Found | `#34d399` (green) | Final nearest neighbors |
| Query vector | `#f87171` (red) | The search target |

### Layer colors (keep existing)
| Layer | Color | Role |
|-------|-------|------|
| L0 (base) | `#4da6ff` (blue) | Dense, all vectors |
| L1 | `#a78bfa` (purple) | Sparser |
| L2 | `#f59e0b` (orange) | Sparse |
| L3 (entry) | `#f87171` (red) | Sparsest, entry point |

---

## Tufte Principles Applied

### Data-ink ratio
- **Essential** (keep): nodes, edges, search path, layer boundaries
- **Chartjunk** (reduce/remove in 2D mode): icosahedron wireframes, breathing animations, cosmic background gradients
- The 2D mode should let the graph topology BE the visualization

### Small multiples
- Side-by-side panels with identical scales for parameter comparison
- Each panel self-contained with minimal labeling (shared legend)
- Let the viewer's eye do the comparison rather than animating a single view

### Sparklines
- Embed inline with parameter controls
- No axes, no labels — just the curve shape and a dot for current value
- Edward Tufte: "Sparklines are data-intense, design-simple, word-sized graphics"

### Information density
- The 3D view is low-density for its screen real estate
- A 2D multi-panel view could show all 4 layers + search replay + parameter sparklines in the same space

---

## Key Sources & References

### HNSW Visualizations
- [A Visual Guide to HNSW (cfu288)](https://cfu288.com/blog/2024-05_visual-guide-to-hnsw/) — Interactive, step-by-step, 2D layered
- [Feder by Zilliz](https://github.com/zilliztech/feder) — D3.js, parses real HNSW index files, animates search
- [HNSW Illustrated (stefanwebb)](https://github.com/stefanwebb/hnsw-illustrated) — Python pedagogical implementation with animations

### Vector DB Company Approaches
- [Pinecone HNSW Guide](https://www.pinecone.io/learn/series/faiss/hnsw/) — Static diagrams, performance charts, parameter tradeoffs
- [Milvus HNSW Docs](https://milvus.io/blog/understand-hierarchical-navigable-small-worlds-hnsw-for-vector-search.md) — Layered diagrams
- [Lantern Memory Calculator](https://lantern.dev/blog/calculator) — Interactive memory footprint visualizer
- [OpenSearch HNSW Hyperparameter Guide](https://opensearch.org/blog/a-practical-guide-to-selecting-hnsw-hyperparameters/)

### Visualization Best Practices
- [Cambridge Intelligence: 10 Rules of Great Graph Design](https://cambridge-intelligence.com/10-rules-great-graph-design/)
- [Cambridge Intelligence: Graph Visualization UX](https://cambridge-intelligence.com/graph-visualization-ux-how-to-avoid-wrecking-your-graph-visualization/)
- [NN/g: Animation Duration and Motion](https://www.nngroup.com/articles/animation-duration/)
- [VisuAlgo: Graph Traversal](https://visualgo.net/en/dfsbfs) — Gold standard for algorithm visualization
- [React Three Fiber: Scaling Performance](https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance) — InstancedMesh for draw-call reduction

### Tufte
- [Data-Ink Principles](https://jtr13.github.io/cc19/tuftes-principles-of-data-ink.html)
- [Sparkline Theory and Practice](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/)

### Original Paper
- [Efficient and robust approximate nearest neighbor search using HNSW (Malkov & Yashunin, 2016)](https://arxiv.org/abs/1603.09320)

---

## Priority Order

1. **Tooltips** (in progress) — low effort, immediate value
2. **2D Analysis view** — high impact, medium effort. Core educational improvement.
3. **Search narration/step-through controls** — high impact, low-medium effort
4. **Parameter sparklines** — medium impact, low effort
5. **Small multiples compare view** — high impact, medium effort
6. **Exact vs approximate overlay** — high impact, high effort
7. **InstancedMesh optimization** — medium impact, medium effort (needed for scaling node counts)
