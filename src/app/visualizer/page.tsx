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

// Dynamic import for the visualization to avoid SSR issues with Three.js
const HNSWVisualization = dynamic(
  () =>
    import("@/components/visualization/HNSWVisualization").then(
      (mod) => mod.HNSWVisualization
    ),
  { ssr: false }
);

export default function VisualizerHome() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* 3D Canvas */}
      <Scene>
        <HNSWVisualization />
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
              <Button variant="outline" size="sm">HNSW</Button>
            </Link>
            <Link href="/visualizer/explore">
              <Button variant="ghost" size="sm">Explore Indices</Button>
            </Link>
            <Link href="/visualizer/embed">
              <Button variant="ghost" size="sm">Embed Text</Button>
            </Link>
            <Link href="/visualizer/compare">
              <Button variant="ghost" size="sm">Compare</Button>
            </Link>
          </nav>
          <h1 className="text-lg font-bold tracking-tight" style={{ textShadow: "0 0 20px rgba(77,166,255,0.3)" }}>
            HNSW + Matryoshka Explorer
          </h1>
          <p className="text-[0.62rem] text-muted-foreground mt-0.5">
            Concentric spheres: inner core = entry point (sparse) → outer shell = base layer (dense)
          </p>
        </header>

        {/* Left Panel */}
        <aside className="col-start-1 row-start-2 self-start flex flex-col gap-2.5 pointer-events-auto">
          <BuildParamsPanel />
          <MRLPanel />
        </aside>

        {/* Right Panel */}
        <aside className="col-start-3 row-start-2 self-start flex flex-col gap-2.5 pointer-events-auto">
          <SearchParamsPanel />
          <LegendPanel />
        </aside>

        {/* Bottom Panel */}
        <footer className="col-span-3 row-start-3 flex justify-center pointer-events-auto">
          <ResourcesPanel />
        </footer>
      </div>

      {/* Hint */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 text-[0.58rem] text-muted-foreground/40 pointer-events-none animate-pulse">
        Drag to orbit · Scroll to zoom · Right-drag to pan
      </div>
    </main>
  );
}
