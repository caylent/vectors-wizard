"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Scene } from "@/components/visualization/Scene";
import { Button } from "@/components/ui/button";
import {
  BuildParamsPanel,
  MRLPanel,
  SearchParamsPanel,
  ResourcesPanel,
  LegendPanel,
} from "@/components/controls/HNSWControls";
import {
  IVFBuildPanel,
  IVFSearchPanel,
  IVFResourcesPanel,
  IVFLegendPanel,
} from "@/components/controls/IVFControls";
import { IndexTypeSelector } from "@/components/controls/IndexTypeSelector";
import { useVisualizationStore, type IndexType } from "@/stores/visualizationStore";

// Dynamic imports for visualizations
const HNSWVisualization = dynamic(
  () =>
    import("@/components/visualization/HNSWVisualization").then(
      (mod) => mod.HNSWVisualization
    ),
  { ssr: false }
);

const IVFVisualization = dynamic(
  () =>
    import("@/components/visualization/IVFVisualization").then(
      (mod) => mod.IVFVisualization
    ),
  { ssr: false }
);

function VisualizationContent({ indexType }: { indexType: IndexType }) {
  switch (indexType) {
    case "hnsw":
      return <HNSWVisualization />;
    case "ivf":
      return <IVFVisualization />;
    default:
      return <HNSWVisualization />;
  }
}

function LeftPanel({ indexType }: { indexType: IndexType }) {
  switch (indexType) {
    case "hnsw":
      return (
        <>
          <BuildParamsPanel />
          <MRLPanel />
        </>
      );
    case "ivf":
      return <IVFBuildPanel />;
    default:
      return <BuildParamsPanel />;
  }
}

function RightPanel({ indexType }: { indexType: IndexType }) {
  switch (indexType) {
    case "hnsw":
      return (
        <>
          <SearchParamsPanel />
          <LegendPanel />
        </>
      );
    case "ivf":
      return (
        <>
          <IVFSearchPanel />
          <IVFLegendPanel />
        </>
      );
    default:
      return <SearchParamsPanel />;
  }
}

function BottomPanel({ indexType }: { indexType: IndexType }) {
  switch (indexType) {
    case "hnsw":
      return <ResourcesPanel />;
    case "ivf":
      return <IVFResourcesPanel />;
    default:
      return <ResourcesPanel />;
  }
}

const INDEX_INFO: Record<IndexType, { title: string; subtitle: string }> = {
  hnsw: {
    title: "HNSW + Matryoshka Explorer",
    subtitle: "Concentric spheres: inner core = entry point (sparse) → outer shell = base layer (dense)",
  },
  ivf: {
    title: "IVF (Inverted File) Explorer",
    subtitle: "Clustered vectors: octahedrons = centroids, nprobe controls search breadth",
  },
  pq: {
    title: "Product Quantization Explorer",
    subtitle: "Coming soon: segmented vectors with codebook compression",
  },
  lsh: {
    title: "LSH (Locality Sensitive Hashing)",
    subtitle: "Coming soon: hash bucket based approximate search",
  },
  flat: {
    title: "Flat Index (Brute Force)",
    subtitle: "Coming soon: exact search baseline for comparison",
  },
};

export default function ExplorePage() {
  const indexType = useVisualizationStore((s) => s.indexType);
  const info = INDEX_INFO[indexType];

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* 3D Canvas */}
      <Scene>
        <VisualizationContent indexType={indexType} />
      </Scene>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-[270px_1fr_270px] grid-rows-[auto_1fr_auto] p-3.5 gap-0">
        {/* Header */}
        <header className="col-span-3 text-center pb-2.5">
          {/* Navigation */}
          <nav className="flex justify-center gap-2 mb-2 pointer-events-auto">
            <Link href="/">
              <Button variant="ghost" size="sm">Calculator</Button>
            </Link>
            <Link href="/visualizer">
              <Button variant="ghost" size="sm">HNSW</Button>
            </Link>
            <Link href="/visualizer/explore">
              <Button variant="outline" size="sm">Explore Indices</Button>
            </Link>
            <Link href="/visualizer/embed">
              <Button variant="ghost" size="sm">Embed Text</Button>
            </Link>
            <Link href="/visualizer/compare">
              <Button variant="ghost" size="sm">Compare</Button>
            </Link>
          </nav>
          <div className="flex justify-center mb-2 pointer-events-auto">
            <IndexTypeSelector />
          </div>
          <h1
            className="text-lg font-bold tracking-tight"
            style={{ textShadow: "0 0 20px rgba(77,166,255,0.3)" }}
          >
            {info.title}
          </h1>
          <p className="text-[0.62rem] text-muted-foreground mt-0.5">
            {info.subtitle}
          </p>
        </header>

        {/* Left Panel */}
        <aside className="col-start-1 row-start-2 self-start flex flex-col gap-2.5 pointer-events-auto">
          <LeftPanel indexType={indexType} />
        </aside>

        {/* Right Panel */}
        <aside className="col-start-3 row-start-2 self-start flex flex-col gap-2.5 pointer-events-auto">
          <RightPanel indexType={indexType} />
        </aside>

        {/* Bottom Panel */}
        <footer className="col-span-3 row-start-3 flex justify-center pointer-events-auto">
          <BottomPanel indexType={indexType} />
        </footer>
      </div>

      {/* Hint */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 text-[0.58rem] text-muted-foreground/40 pointer-events-none animate-pulse">
        Drag to orbit · Scroll to zoom · Right-drag to pan
      </div>
    </main>
  );
}
