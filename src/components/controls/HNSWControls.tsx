"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MetricBar } from "@/components/ui/metric-bar";
import { Tooltip } from "@/components/ui/Tooltip";
import { useIndexStore, DIMENSION_OPTIONS } from "@/stores/indexStore";
import { useVisualizationStore } from "@/stores/visualizationStore";
import {
  calculateHNSWMetrics,
  formatBytes,
  formatNumber,
  formatTime,
  getBuildSpeedRating,
} from "@/lib/metrics/hnsw-metrics";
import { useEffect, useMemo } from "react";

export function BuildParamsPanel() {
  const { hnsw, vectorCount, dimensions, mrlDimensions, setHNSWParam, setVectorCount, setMetrics } =
    useIndexStore();

  // Calculate and update metrics when parameters change
  const metrics = useMemo(() => {
    return calculateHNSWMetrics({
      vectorCount,
      dimensions,
      mrlDimensions,
      M: hnsw.M,
      efConstruction: hnsw.efConstruction,
      efSearch: hnsw.efSearch,
    });
  }, [vectorCount, dimensions, mrlDimensions, hnsw]);

  useEffect(() => {
    setMetrics(metrics);
  }, [metrics, setMetrics]);

  const buildSpeed = getBuildSpeedRating(hnsw.M);
  const recallPercent = Math.round(metrics.recall * 100);

  return (
    <Card>
      <CardHeader>
        <Badge variant="blue">INDEX</Badge>
        <CardTitle>Build Params</CardTitle>
      </CardHeader>
      <CardDescription>
        Set at construction time. Requires rebuild to change.
      </CardDescription>
      <CardContent className="space-y-2">
        <Slider
          label={<>M (connections/node)<Tooltip text="Maximum bidirectional links per node. Higher M means better recall but more memory and slower builds. Layer 0 uses 2xM connections, upper layers use M. Typical range: 4-48." /></>}
          value={hnsw.M}
          min={2}
          max={48}
          step={2}
          onChange={(v) => setHNSWParam("M", Math.round(v))}
        />
        <Slider
          label={<>ef_construction<Tooltip text="Beam width used when building the index. Higher values produce a better-connected graph at the cost of slower index construction. Typical range: 64-512." /></>}
          value={hnsw.efConstruction}
          min={16}
          max={512}
          step={16}
          onChange={(v) => setHNSWParam("efConstruction", Math.round(v))}
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
          label={<>Recall<Tooltip text="The percentage of true nearest neighbors found by the approximate search compared to an exact brute-force search. 100% recall means the approximate search found all the same results as exact search." /></>}
          value={`~${recallPercent}%`}
          percent={recallPercent}
          color="blue"
        />
        <MetricBar
          label="Build"
          value={buildSpeed.label}
          percent={buildSpeed.percent}
          color="orange"
        />
      </CardContent>
    </Card>
  );
}

export function MRLPanel() {
  const { dimensions, mrlDimensions, setDimensions, setMRLDimensions, metrics } = useIndexStore();

  const dimIndex = DIMENSION_OPTIONS.indexOf(dimensions);
  const mrlIndex = DIMENSION_OPTIONS.indexOf(mrlDimensions);
  const ratio = mrlDimensions / dimensions;
  const mrlQualityPercent = Math.round(metrics.mrlQuality * 100);

  return (
    <Card>
      <CardHeader>
        <Badge variant="purple">MRL<Tooltip text="Matryoshka Representation Learning allows truncating embeddings to fewer dimensions while preserving search quality. Lower dimensions reduce storage and speed up queries." /></Badge>
        <CardTitle>Dimensions</CardTitle>
      </CardHeader>
      <CardDescription>
        Dimension truncation. Lower dims = less storage, faster search, slight accuracy loss.
      </CardDescription>
      <CardContent className="space-y-2">
        <Slider
          label="Full dimensions"
          value={dimIndex}
          min={0}
          max={DIMENSION_OPTIONS.length - 1}
          step={1}
          onChange={(v) => {
            const newDim = DIMENSION_OPTIONS[Math.round(v)];
            setDimensions(newDim);
            if (mrlDimensions > newDim) {
              setMRLDimensions(newDim);
            }
          }}
          formatValue={() => dimensions.toString()}
          color="purple"
        />
        <Slider
          label="MRL truncation"
          value={mrlIndex}
          min={0}
          max={DIMENSION_OPTIONS.indexOf(dimensions)}
          step={1}
          onChange={(v) => {
            const newMrl = DIMENSION_OPTIONS[Math.round(v)];
            setMRLDimensions(Math.min(newMrl, dimensions));
          }}
          formatValue={() => mrlDimensions.toString()}
          color="purple"
        />

        {/* Dimension visualization */}
        <div className="flex gap-px h-4 rounded overflow-hidden my-2">
          {Array.from({ length: 20 }).map((_, i) => {
            const active = i / 20 < ratio;
            const hue = 250 + (i / 20) * 60;
            return (
              <div
                key={i}
                className="flex-1 transition-all duration-300"
                style={{
                  background: active ? `hsl(${hue}, 70%, 60%)` : "#1a2030",
                  opacity: active ? 1 : 0.2,
                }}
              />
            );
          })}
        </div>

        <div className="flex justify-between text-[0.55rem] text-muted-foreground/60">
          <span>
            Used: <strong className="text-foreground">{Math.round(ratio * 100)}%</strong>
          </span>
          <span>
            Savings: <strong className="text-foreground">{100 - Math.round(ratio * 100)}%</strong>
          </span>
        </div>

        <div className="h-px bg-border my-2" />

        <MetricBar
          label="Quality"
          value={`~${mrlQualityPercent}%`}
          percent={mrlQualityPercent}
          color="purple"
        />
      </CardContent>
    </Card>
  );
}

export function SearchParamsPanel() {
  const { hnsw, setHNSWParam, metrics } = useIndexStore();
  const { isSearching, setIsSearching } = useVisualizationStore();

  const recallPercent = Math.round(metrics.recall * 100);
  const latencyDisplay = metrics.queryLatencyMs < 1 ? "<1ms" : `~${Math.round(metrics.queryLatencyMs)}ms`;
  const qpsDisplay = metrics.qps > 1000 ? `~${(metrics.qps / 1000).toFixed(1)}K` : `~${Math.round(metrics.qps)}`;

  const handleSearch = () => {
    if (isSearching) return;
    setIsSearching(true);
    // Search animation lifecycle is handled by HNSWSearchAnimation component
  };

  return (
    <Card>
      <CardHeader>
        <Badge variant="orange">SEARCH</Badge>
        <CardTitle>Query Params</CardTitle>
      </CardHeader>
      <CardDescription>
        Tunable per-query. No rebuild needed. Trades latency for recall.
      </CardDescription>
      <CardContent className="space-y-2">
        <Slider
          label={<>ef_search (candidates)<Tooltip text="Number of candidate nodes explored per query. Higher values improve recall (accuracy) but increase latency. Must be >= k (number of results requested). Typical range: 10-200." /></>}
          value={hnsw.efSearch}
          min={4}
          max={200}
          step={2}
          onChange={(v) => setHNSWParam("efSearch", Math.round(v))}
          color="orange"
        />

        <div className="h-px bg-border my-2" />

        <MetricBar
          label={<>Recall<Tooltip text="The percentage of true nearest neighbors found by the approximate search compared to an exact brute-force search. 100% recall means the approximate search found all the same results as exact search." /></>}
          value={`~${recallPercent}%`}
          percent={recallPercent}
          color="blue"
        />
        <MetricBar
          label={<>Latency<Tooltip text="Estimated time to complete a single query. Lower is better. Increases with higher efSearch, more vectors, and higher dimensions." /></>}
          value={latencyDisplay}
          percent={Math.min(100, metrics.queryLatencyMs / 50 * 100)}
          color="orange"
        />
        <MetricBar
          label={<>QPS<Tooltip text="Queries Per Second -- the estimated throughput of the index. Higher is better. Affected by vector count, dimensions, M, and efSearch." /></>}
          value={qpsDisplay}
          percent={Math.min(100, metrics.qps / 15000 * 100)}
          color="green"
        />

        <Button
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full mt-2"
        >
          {isSearching ? "Searching..." : "Run Search"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ResourcesPanel() {
  const { metrics, vectorCount, mrlDimensions, hnsw } = useIndexStore();

  return (
    <div className="flex gap-2.5 justify-center flex-wrap">
      <Card className="text-center min-w-[105px] px-3.5 py-2.5">
        <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wide mb-0.5 flex items-center justify-center">
          Vectors<Tooltip text="Raw vector data size: number of vectors x dimensions x 4 bytes (32-bit floats)." />
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
          Graph<Tooltip text="HNSW graph overhead: approximately vectors x M x 2 x 8 bytes for storing neighbor connection lists." />
        </div>
        <div className="text-sm font-bold text-viz-purple">
          {formatBytes(metrics.graphStorageBytes)}
        </div>
        <div className="text-[0.52rem] text-muted-foreground/60 mt-0.5">
          ~N×{hnsw.M}×8B
        </div>
      </Card>

      <Card className="text-center min-w-[105px] px-3.5 py-2.5">
        <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wide mb-0.5">
          Total Index
        </div>
        <div className="text-sm font-bold text-viz-orange">
          {formatBytes(metrics.totalStorageBytes)}
        </div>
        <div className="text-[0.52rem] text-muted-foreground/60 mt-0.5">
          vec + graph + meta
        </div>
      </Card>

      <Card className="text-center min-w-[105px] px-3.5 py-2.5">
        <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wide mb-0.5 flex items-center justify-center">
          RAM<Tooltip text="Estimated memory needed at runtime. Typically ~1.3x the total index size to account for working memory during search." />
        </div>
        <div className="text-sm font-bold text-viz-green">
          {formatBytes(metrics.ramUsageBytes)}
        </div>
        <div className="text-[0.52rem] text-muted-foreground/60 mt-0.5">
          ~1.3× index
        </div>
      </Card>

      <Card className="text-center min-w-[105px] px-3.5 py-2.5">
        <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wide mb-0.5">
          Build Time
        </div>
        <div className="text-sm font-bold text-foreground">
          {formatTime(metrics.buildTimeSeconds)}
        </div>
        <div className="text-[0.52rem] text-muted-foreground/60 mt-0.5">
          O(NMlogN×d)
        </div>
      </Card>
    </div>
  );
}

export function LegendPanel() {
  const items = [
    { label: "L0", color: "#4da6ff" },
    { label: "L1", color: "#a78bfa" },
    { label: "L2", color: "#f59e0b" },
    { label: "L3", color: "#f87171" },
    { label: "Query", color: "#fbbf24" },
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
