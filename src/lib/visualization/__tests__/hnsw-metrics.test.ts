/**
 * Tests for HNSW metrics calculations
 *
 * Validates storage estimates, performance projections,
 * recall formulas, and utility formatting functions.
 */
import { describe, it, expect } from "vitest";
import {
  calculateHNSWMetrics,
  formatBytes,
  formatNumber,
  formatTime,
  getBuildSpeedRating,
  type HNSWMetricsInput,
} from "@/lib/metrics/hnsw-metrics";

const defaultInput: HNSWMetricsInput = {
  vectorCount: 100000,
  dimensions: 3072,
  mrlDimensions: 1536,
  M: 4,
  efConstruction: 100,
  efSearch: 20,
};

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(2048)).toBe("2.0KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(5 * 1048576)).toBe("5.0MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(2.5 * 1073741824)).toBe("2.50GB");
  });

  it("handles zero", () => {
    expect(formatBytes(0)).toBe("0B");
  });
});

describe("formatNumber", () => {
  it("formats small numbers as-is", () => {
    expect(formatNumber(999)).toBe("999");
  });

  it("formats thousands with K suffix", () => {
    expect(formatNumber(1000)).toBe("1.0K");
    expect(formatNumber(50000)).toBe("50K");
  });

  it("formats millions with M suffix", () => {
    expect(formatNumber(1000000)).toBe("1.0M");
    expect(formatNumber(50000000)).toBe("50M");
  });

  it("formats billions with B suffix", () => {
    expect(formatNumber(1000000000)).toBe("1.0B");
  });
});

describe("formatTime", () => {
  it("formats sub-millisecond as <1ms", () => {
    expect(formatTime(0.0001)).toBe("<1ms");
  });

  it("formats milliseconds", () => {
    expect(formatTime(0.5)).toBe("500ms");
  });

  it("formats seconds", () => {
    expect(formatTime(30)).toBe("30.0s");
  });

  it("formats minutes", () => {
    expect(formatTime(120)).toBe("2.0m");
  });

  it("formats hours", () => {
    expect(formatTime(7200)).toBe("2.0h");
  });
});

describe("calculateHNSWMetrics", () => {
  it("calculates vector storage as N * d_mrl * 4", () => {
    const metrics = calculateHNSWMetrics(defaultInput);
    expect(metrics.vectorStorageBytes).toBe(100000 * 1536 * 4);
  });

  it("graph storage increases with M", () => {
    const lowM = calculateHNSWMetrics({ ...defaultInput, M: 2 });
    const highM = calculateHNSWMetrics({ ...defaultInput, M: 32 });
    expect(highM.graphStorageBytes).toBeGreaterThan(lowM.graphStorageBytes);
  });

  it("total storage includes vectors, graph, and metadata", () => {
    const metrics = calculateHNSWMetrics(defaultInput);
    expect(metrics.totalStorageBytes).toBeGreaterThan(
      metrics.vectorStorageBytes
    );
    expect(metrics.totalStorageBytes).toBeGreaterThan(
      metrics.graphStorageBytes
    );
    // Total = vectors + graph + N*16
    const expected =
      metrics.vectorStorageBytes +
      metrics.graphStorageBytes +
      defaultInput.vectorCount * 16;
    expect(metrics.totalStorageBytes).toBe(expected);
  });

  it("RAM usage is ~1.3x total storage", () => {
    const metrics = calculateHNSWMetrics(defaultInput);
    expect(metrics.ramUsageBytes).toBeCloseTo(
      metrics.totalStorageBytes * 1.3,
      0
    );
  });

  it("build time increases with vector count", () => {
    const small = calculateHNSWMetrics({
      ...defaultInput,
      vectorCount: 1000,
    });
    const large = calculateHNSWMetrics({
      ...defaultInput,
      vectorCount: 1000000,
    });
    expect(large.buildTimeSeconds).toBeGreaterThan(small.buildTimeSeconds);
  });

  it("build time increases with M", () => {
    const lowM = calculateHNSWMetrics({ ...defaultInput, M: 4 });
    const highM = calculateHNSWMetrics({ ...defaultInput, M: 32 });
    expect(highM.buildTimeSeconds).toBeGreaterThan(lowM.buildTimeSeconds);
  });

  it("QPS decreases with higher ef_search", () => {
    const lowEf = calculateHNSWMetrics({ ...defaultInput, efSearch: 10 });
    const highEf = calculateHNSWMetrics({ ...defaultInput, efSearch: 200 });
    expect(lowEf.qps).toBeGreaterThan(highEf.qps);
  });

  it("recall increases with higher M", () => {
    const lowM = calculateHNSWMetrics({ ...defaultInput, M: 2 });
    const highM = calculateHNSWMetrics({ ...defaultInput, M: 32 });
    expect(highM.recall).toBeGreaterThan(lowM.recall);
  });

  it("recall increases with higher ef_search", () => {
    const lowEf = calculateHNSWMetrics({ ...defaultInput, efSearch: 4 });
    const highEf = calculateHNSWMetrics({ ...defaultInput, efSearch: 100 });
    expect(highEf.recall).toBeGreaterThan(lowEf.recall);
  });

  it("recall is capped at 0.995", () => {
    const metrics = calculateHNSWMetrics({
      ...defaultInput,
      M: 48,
      efSearch: 200,
      efConstruction: 512,
    });
    expect(metrics.recall).toBeLessThanOrEqual(0.995);
  });

  it("MRL quality decreases with more truncation", () => {
    const full = calculateHNSWMetrics({
      ...defaultInput,
      mrlDimensions: 3072,
    });
    const half = calculateHNSWMetrics({
      ...defaultInput,
      mrlDimensions: 1536,
    });
    const quarter = calculateHNSWMetrics({
      ...defaultInput,
      mrlDimensions: 768,
    });

    expect(full.mrlQuality).toBeGreaterThan(half.mrlQuality);
    expect(half.mrlQuality).toBeGreaterThan(quarter.mrlQuality);
  });

  it("MRL quality is 1.0 when no truncation (mrl == full dims)", () => {
    const metrics = calculateHNSWMetrics({
      ...defaultInput,
      mrlDimensions: 3072,
    });
    expect(metrics.mrlQuality).toBeCloseTo(1.0, 5);
  });

  it("uses mrlDimensions (not full dimensions) for vector storage", () => {
    const full = calculateHNSWMetrics({
      ...defaultInput,
      mrlDimensions: 3072,
    });
    const half = calculateHNSWMetrics({
      ...defaultInput,
      mrlDimensions: 1536,
    });
    expect(full.vectorStorageBytes).toBe(2 * half.vectorStorageBytes);
  });
});

describe("getBuildSpeedRating", () => {
  it("returns Fast for low M values", () => {
    const rating = getBuildSpeedRating(2);
    expect(rating.label).toBe("Fast");
    expect(rating.percent).toBeGreaterThan(70);
  });

  it("returns Slow for high M values", () => {
    const rating = getBuildSpeedRating(48);
    expect(rating.label).toBe("Slow");
    expect(rating.percent).toBeLessThanOrEqual(40);
  });

  it("returns Med for medium M values", () => {
    const rating = getBuildSpeedRating(20);
    expect(rating.label).toBe("Med");
  });

  it("never returns percent below 5", () => {
    const rating = getBuildSpeedRating(100);
    expect(rating.percent).toBeGreaterThanOrEqual(5);
  });

  it("percent decreases as M increases", () => {
    const lowM = getBuildSpeedRating(4);
    const highM = getBuildSpeedRating(32);
    expect(lowM.percent).toBeGreaterThan(highM.percent);
  });
});
