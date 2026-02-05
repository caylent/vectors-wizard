"use client";

import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Dynamic imports
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

function MiniScene({ children }: { children: React.ReactNode }) {
  return (
    <Canvas
      camera={{
        position: [20, 10, 20],
        fov: 50,
        near: 0.1,
        far: 500,
      }}
      gl={{
        antialias: true,
      }}
      dpr={[1, 2]}
    >
      <color attach="background" args={["#020408"]} />
      <Suspense fallback={null}>
        <ambientLight intensity={0.25} />
        <directionalLight position={[20, 30, 20]} intensity={0.6} />
        <pointLight position={[0, 0, 0]} color="#4da6ff" intensity={0.5} distance={40} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          autoRotate
          autoRotateSpeed={0.5}
          minDistance={15}
          maxDistance={50}
        />
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />
        {children}
      </Suspense>
    </Canvas>
  );
}

function IndexCard({
  title,
  badge,
  description,
  pros,
  cons,
  children,
}: {
  title: string;
  badge: string;
  description: string;
  pros: string[];
  cons: string[];
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="blue">{badge}</Badge>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="h-64 rounded-lg overflow-hidden border border-border mb-4">
          {children}
        </div>

        <p className="text-xs text-muted-foreground mb-4">{description}</p>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-semibold text-viz-green mb-1">Pros</div>
            <ul className="space-y-1">
              {pros.map((pro, i) => (
                <li key={i} className="text-muted-foreground">
                  + {pro}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-viz-red mb-1">Cons</div>
            <ul className="space-y-1">
              {cons.map((con, i) => (
                <li key={i} className="text-muted-foreground">
                  - {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <Link href="/visualizer" className="inline-block">
            <h1
              className="text-2xl font-bold tracking-tight hover:text-primary transition-colors"
              style={{ textShadow: "0 0 20px rgba(77,166,255,0.3)" }}
            >
              Index Comparison
            </h1>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            Compare different vector index algorithms side-by-side
          </p>
        </header>

        {/* Navigation */}
        <nav className="flex justify-center gap-2 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              Calculator
            </Button>
          </Link>
          <Link href="/visualizer">
            <Button variant="ghost" size="sm">
              HNSW
            </Button>
          </Link>
          <Link href="/visualizer/explore">
            <Button variant="ghost" size="sm">
              Explore
            </Button>
          </Link>
          <Link href="/visualizer/embed">
            <Button variant="ghost" size="sm">
              Embed Text
            </Button>
          </Link>
          <Link href="/visualizer/compare">
            <Button variant="outline" size="sm">
              Compare
            </Button>
          </Link>
        </nav>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <IndexCard
            title="HNSW"
            badge="GRAPH"
            description="Hierarchical Navigable Small World - A graph-based index with multiple layers for efficient approximate nearest neighbor search."
            pros={[
              "High recall (95-99%)",
              "Fast search (sub-ms)",
              "No training required",
              "Supports incremental updates",
            ]}
            cons={[
              "Higher memory usage",
              "Slower build time",
              "Cannot compress vectors",
              "Not ideal for very large datasets",
            ]}
          >
            <MiniScene>
              <HNSWVisualization />
            </MiniScene>
          </IndexCard>

          <IndexCard
            title="IVF"
            badge="CLUSTER"
            description="Inverted File Index - Partitions vectors into clusters using k-means, then searches only relevant clusters."
            pros={[
              "Good scalability",
              "Lower memory footprint",
              "Can combine with PQ",
              "Predictable performance",
            ]}
            cons={[
              "Requires training",
              "Fixed cluster count",
              "Lower recall at edges",
              "Needs parameter tuning",
            ]}
          >
            <MiniScene>
              <IVFVisualization />
            </MiniScene>
          </IndexCard>
        </div>

        {/* Comparison Table */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3">Feature</th>
                    <th className="text-center py-2 px-3">HNSW</th>
                    <th className="text-center py-2 px-3">IVF</th>
                    <th className="text-center py-2 px-3 text-muted-foreground">PQ</th>
                    <th className="text-center py-2 px-3 text-muted-foreground">LSH</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted-foreground">Recall @10</td>
                    <td className="text-center py-2 px-3 text-viz-green">95-99%</td>
                    <td className="text-center py-2 px-3 text-viz-blue">80-95%</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">70-85%</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">60-80%</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted-foreground">Query Speed</td>
                    <td className="text-center py-2 px-3 text-viz-green">Fast</td>
                    <td className="text-center py-2 px-3 text-viz-blue">Medium</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">Fast</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">Fast</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted-foreground">Memory</td>
                    <td className="text-center py-2 px-3 text-viz-orange">High</td>
                    <td className="text-center py-2 px-3 text-viz-blue">Medium</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">Low</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">Medium</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted-foreground">Build Time</td>
                    <td className="text-center py-2 px-3 text-viz-orange">Slow</td>
                    <td className="text-center py-2 px-3 text-viz-blue">Medium</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">Slow</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">Fast</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted-foreground">Updates</td>
                    <td className="text-center py-2 px-3 text-viz-green">Yes</td>
                    <td className="text-center py-2 px-3 text-viz-orange">Rebuild</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">Rebuild</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">Yes</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-muted-foreground">Best For</td>
                    <td className="text-center py-2 px-3 text-xs">High recall, smaller datasets</td>
                    <td className="text-center py-2 px-3 text-xs">Balanced, medium datasets</td>
                    <td className="text-center py-2 px-3 text-xs text-muted-foreground">Memory constrained</td>
                    <td className="text-center py-2 px-3 text-xs text-muted-foreground">Simple use cases</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
