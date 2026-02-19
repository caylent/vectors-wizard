"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MetricBar } from "@/components/ui/metric-bar";
import { Tooltip } from "@/components/ui/Tooltip";
import { useIndexStore } from "@/stores/indexStore";
import { useVisualizationStore } from "@/stores/visualizationStore";
import { calculateIVFMetrics } from "@/lib/visualization/ivf-layout";
import { formatBytes, formatNumber, formatTime } from "@/lib/metrics/hnsw-metrics";
import { useMemo } from "react";

export function IVFBuildPanel() {
  const { ivf, vectorCount, mrlDimensions, setIVFParam, setVectorCount } = useIndexStore();

  const metrics = useMemo(() => {
    return calculateIVFMetrics(vectorCount, mrlDimensions, ivf.nlist, ivf.nprobe);
  }, [vectorCount, mrlDimensions, ivf]);

  const recallPercent = Math.round(metrics.recall * 100);

  return (
    <Card>
      <CardHeader>
        <Badge variant="blue">IVF</Badge>
        <CardTitle>Build Params</CardTitle>
      </CardHeader>
      <CardDescription>
        k-means clustering. More clusters = faster search but lower recall per probe.
      </CardDescription>
      <CardContent className="space-y-2">
        <Slider
          label={<>nlist (clusters)<Tooltip text="Number of Voronoi cells created by k-means clustering during index build. More clusters means finer partitioning. Should scale with dataset size -- a common rule of thumb is sqrt(N). Typical range: 10-1,000." /></>}
          value={ivf.nlist}
          min={10}
          max={1000}
          step={10}
          onChange={(v) => setIVFParam("nlist", Math.round(v))}
          formatValue={(v) => formatNumber(v)}
        />
        <Slider
          label="Vector count"
          value={Math.log10(vectorCount)}
          min={3}
          max={7}
          step={0.1}
          onChange={(v) => setVectorCount(Math.round(Math.pow(10, v)))}
          formatValue={() => formatNumber(vectorCount)}
        />

        <div className="h-px bg-border my-2" />

        <MetricBar
          label={<>Recall<Tooltip text="The percentage of true nearest neighbors found compared to exact search. Increases with higher nprobe but with diminishing returns." /></>}
          value={`~${recallPercent}%`}
          percent={recallPercent}
          color="blue"
        />

        <div className="text-[0.55rem] text-muted-foreground mt-2">
          Optimal nlist: √N ≈ {formatNumber(Math.round(Math.sqrt(vectorCount)))}
        </div>
      </CardContent>
    </Card>
  );
}

export function IVFSearchPanel() {
  const { ivf, setIVFParam, vectorCount, mrlDimensions } = useIndexStore();
  const { isSearching, setIsSearching } = useVisualizationStore();

  const metrics = useMemo(() => {
    return calculateIVFMetrics(vectorCount, mrlDimensions, ivf.nlist, ivf.nprobe);
  }, [vectorCount, mrlDimensions, ivf]);

  const recallPercent = Math.round(metrics.recall * 100);
  const qps = Math.round(1000 / Math.max(metrics.queryLatencyMs, 0.01));

  const handleSearch = () => {
    if (isSearching) return;
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <Badge variant="orange">SEARCH</Badge>
        <CardTitle>Query Params</CardTitle>
      </CardHeader>
      <CardDescription>
        nprobe: number of clusters to search. More = higher recall, slower search.
      </CardDescription>
      <CardContent className="space-y-2">
        <Slider
          label={<>nprobe (search breadth)<Tooltip text="Number of clusters searched per query. Higher nprobe improves recall but increases latency. Setting nprobe = nlist is equivalent to brute-force search. Typical range: 1-100." /></>}
          value={ivf.nprobe}
          min={1}
          max={Math.min(ivf.nlist, 100)}
          step={1}
          onChange={(v) => setIVFParam("nprobe", Math.round(v))}
          color="orange"
        />

        <div className="h-px bg-border my-2" />

        <MetricBar
          label={<>Recall<Tooltip text="The percentage of true nearest neighbors found compared to exact search. Increases with higher nprobe but with diminishing returns." /></>}
          value={`~${recallPercent}%`}
          percent={recallPercent}
          color="blue"
        />
        <MetricBar
          label={<>Latency<Tooltip text="Estimated query response time. Proportional to nprobe x (vectors / nlist) -- more probes and larger clusters mean slower queries." /></>}
          value={metrics.queryLatencyMs < 1 ? "<1ms" : `~${metrics.queryLatencyMs.toFixed(1)}ms`}
          percent={Math.min(100, metrics.queryLatencyMs * 10)}
          color="orange"
        />
        <MetricBar
          label={<>QPS<Tooltip text="Queries Per Second -- estimated throughput. Decreases as nprobe increases since more clusters must be searched." /></>}
          value={qps > 1000 ? `${(qps / 1000).toFixed(1)}K` : `${qps}`}
          percent={Math.min(100, qps / 100)}
          color="green"
        />

        <Button
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full mt-2"
        >
          {isSearching ? "Searching..." : "Run Search"}
        </Button>

        <div className="text-[0.55rem] text-muted-foreground mt-2">
          Scanning {((ivf.nprobe / ivf.nlist) * 100).toFixed(1)}% of vectors
        </div>
      </CardContent>
    </Card>
  );
}

export function IVFResourcesPanel() {
  const { ivf, vectorCount, mrlDimensions } = useIndexStore();

  const metrics = useMemo(() => {
    return calculateIVFMetrics(vectorCount, mrlDimensions, ivf.nlist, ivf.nprobe);
  }, [vectorCount, mrlDimensions, ivf]);

  return (
    <div className="flex gap-2.5 justify-center flex-wrap">
      <Card className="text-center min-w-[105px] px-3.5 py-2.5">
        <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wide mb-0.5">
          Vectors
        </div>
        <div className="text-sm font-bold text-viz-blue">
          {formatBytes(metrics.vectorStorageBytes)}
        </div>
        <div className="text-[0.52rem] text-muted-foreground/60 mt-0.5">
          {formatNumber(vectorCount)}×{mrlDimensions}×4B
        </div>
      </Card>

      <Card className="text-center min-w-[105px] px-3.5 py-2.5">
        <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wide mb-0.5 flex items-center justify-center">
          Centroids<Tooltip text="Storage for cluster center vectors: nlist x dimensions x 4 bytes. These are the reference points for determining which cluster a query vector is closest to." />
        </div>
        <div className="text-sm font-bold text-viz-purple">
          {formatBytes(metrics.centroidStorageBytes)}
        </div>
        <div className="text-[0.52rem] text-muted-foreground/60 mt-0.5">
          {ivf.nlist}×{mrlDimensions}×4B
        </div>
      </Card>

      <Card className="text-center min-w-[105px] px-3.5 py-2.5">
        <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wide mb-0.5 flex items-center justify-center">
          Inv. Lists<Tooltip text="Storage for mapping vectors to clusters: N x 8 bytes for vector IDs and offset pointers. Each cluster maintains a list of which vectors belong to it." />
        </div>
        <div className="text-sm font-bold text-viz-orange">
          {formatBytes(metrics.invertedListsBytes)}
        </div>
        <div className="text-[0.52rem] text-muted-foreground/60 mt-0.5">
          N×8B pointers
        </div>
      </Card>

      <Card className="text-center min-w-[105px] px-3.5 py-2.5">
        <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wide mb-0.5">
          Total
        </div>
        <div className="text-sm font-bold text-viz-green">
          {formatBytes(metrics.totalStorageBytes)}
        </div>
        <div className="text-[0.52rem] text-muted-foreground/60 mt-0.5">
          vec + cent + list
        </div>
      </Card>

      <Card className="text-center min-w-[105px] px-3.5 py-2.5">
        <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wide mb-0.5 flex items-center justify-center">
          Build Time<Tooltip text="Dominated by k-means clustering iterations. Complexity scales with number of vectors, dimensions, nlist, and number of iterations." />
        </div>
        <div className="text-sm font-bold text-foreground">
          {formatTime(metrics.buildTimeSeconds)}
        </div>
        <div className="text-[0.52rem] text-muted-foreground/60 mt-0.5">
          k-means iter
        </div>
      </Card>
    </div>
  );
}

export function IVFLegendPanel() {
  const items = [
    { label: "Centroid", color: "#4da6ff" },
    { label: "Probed", color: "#fbbf24" },
    { label: "Point", color: "#a78bfa" },
    { label: "Found", color: "#34d399" },
  ];

  return (
    <Card className="px-3 py-1.5">
      <div className="flex gap-2.5 justify-center flex-wrap">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1 text-[0.58rem] text-muted-foreground">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: item.color }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </Card>
  );
}
