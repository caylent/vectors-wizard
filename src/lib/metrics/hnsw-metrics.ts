/**
 * HNSW index metrics calculations
 *
 * Provides formulas for estimating storage, build time, search performance,
 * and recall based on index parameters.
 */

import type { IndexMetrics } from "@/stores/indexStore";

export interface HNSWMetricsInput {
  vectorCount: number; // N - number of vectors
  dimensions: number; // d - full embedding dimensions
  mrlDimensions: number; // d_mrl - MRL truncated dimensions
  M: number; // Max connections per node
  efConstruction: number; // Construction beam width
  efSearch: number; // Search beam width
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + "KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + "MB";
  return (bytes / 1073741824).toFixed(2) + "GB";
}

/**
 * Format number with K/M/B suffix
 */
export function formatNumber(n: number): string {
  if (n < 1e3) return n.toString();
  if (n < 1e6) return (n / 1e3).toFixed(n < 1e4 ? 1 : 0) + "K";
  if (n < 1e9) return (n / 1e6).toFixed(n < 1e7 ? 1 : 0) + "M";
  return (n / 1e9).toFixed(1) + "B";
}

/**
 * Format time to human-readable string
 */
export function formatTime(seconds: number): string {
  if (seconds < 0.001) return "<1ms";
  if (seconds < 1) return Math.round(seconds * 1000) + "ms";
  if (seconds < 60) return seconds.toFixed(1) + "s";
  if (seconds < 3600) return (seconds / 60).toFixed(1) + "m";
  return (seconds / 3600).toFixed(1) + "h";
}

/**
 * Calculate HNSW index metrics
 */
export function calculateHNSWMetrics(input: HNSWMetricsInput): IndexMetrics {
  const { vectorCount: N, dimensions: D, mrlDimensions: d, M, efConstruction: efC, efSearch: ef } = input;

  // Vector storage: N vectors × d dimensions × 4 bytes per float32
  const vectorStorageBytes = N * d * 4;

  // Graph storage estimation
  // Layer 0: N nodes × 2M edges × 4 bytes (node id) + 4 bytes overhead per node
  const layer0Bytes = N * (2 * M * 4 + 4);

  // Upper layers: exponentially fewer nodes
  // Expected nodes at layer l: N * exp(-l * ln(M))
  let upperLayerBytes = 0;
  for (let l = 1; l < 4; l++) {
    const expectedNodes = N * Math.exp(-l * Math.log(Math.max(M, 2)));
    upperLayerBytes += expectedNodes * (M * 4 + 4);
  }

  const graphStorageBytes = layer0Bytes + upperLayerBytes;

  // Total: vectors + graph + metadata (~16 bytes per vector)
  const totalStorageBytes = vectorStorageBytes + graphStorageBytes + N * 16;

  // RAM usage: ~1.3x index size during operation
  const ramUsageBytes = totalStorageBytes * 1.3;

  // Build time estimation (empirical formula)
  // O(N × M × log(N) × efConstruction × d)
  // Normalized to ~500K ops/second baseline
  const buildTimeSeconds = (N * M * Math.log2(N) * efC / 100 * (d / 768)) / 500000;

  // Query performance estimation
  // QPS inversely proportional to ef and d, scales with log(N)
  const qps = 10000 * (10 / ef) * (128 / d) * (Math.log(1e5) / Math.log(N));
  const queryLatencyMs = 1000 / Math.max(qps, 1);

  // Recall estimation
  // Recall improves with M (more connections) and ef (wider search)
  const mRecall = 1 - Math.exp(-0.12 * M);
  const efRecall = 1 - Math.exp(-0.08 * ef);

  // MRL quality factor: (truncated_dims / full_dims)^0.25
  // Empirically, quality degrades slowly with dimension reduction
  const mrlQuality = Math.pow(d / D, 0.25);

  // Construction quality factor
  const efcFactor = Math.min(1, efC / (M * 10));

  // Combined recall estimate
  const recall = Math.min(0.995, mRecall * efRecall * mrlQuality * efcFactor * 1.1);

  return {
    vectorStorageBytes,
    graphStorageBytes,
    totalStorageBytes,
    ramUsageBytes,
    buildTimeSeconds,
    queryLatencyMs,
    qps,
    recall,
    mrlQuality,
  };
}

/**
 * Calculate build speed rating (Fast/Med/Slow)
 */
export function getBuildSpeedRating(M: number): { label: string; percent: number } {
  const percent = Math.max(5, 100 - (M - 2) * 2.2);
  const label = percent > 70 ? "Fast" : percent > 40 ? "Med" : "Slow";
  return { label, percent };
}
