/**
 * Tests for IVF layout algorithms
 *
 * Validates centroid generation, point clustering, nearest-centroid search,
 * cluster boundary generation, and IVF metrics calculations.
 */
import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  generateCentroids,
  getCentroidPosition,
  generateClusteredPoints,
  findNearestCentroids,
  generateClusterBoundaries,
  calculateIVFMetrics,
  IVF_RADIUS,
  CLUSTER_COLORS,
} from "../ivf-layout";

describe("constants", () => {
  it("IVF_RADIUS is a positive number", () => {
    expect(IVF_RADIUS).toBeGreaterThan(0);
  });

  it("CLUSTER_COLORS has at least 10 colors", () => {
    expect(CLUSTER_COLORS.length).toBeGreaterThanOrEqual(10);
  });
});

describe("generateCentroids", () => {
  it("returns the requested number of centroids", () => {
    expect(generateCentroids(5)).toHaveLength(5);
    expect(generateCentroids(10)).toHaveLength(10);
    expect(generateCentroids(20)).toHaveLength(20);
  });

  it("assigns sequential IDs starting from 0", () => {
    const centroids = generateCentroids(8);
    for (let i = 0; i < 8; i++) {
      expect(centroids[i].id).toBe(i);
    }
  });

  it("assigns colors cycling through CLUSTER_COLORS", () => {
    const centroids = generateCentroids(15);
    for (let i = 0; i < 15; i++) {
      expect(centroids[i].color).toBe(CLUSTER_COLORS[i % CLUSTER_COLORS.length]);
    }
  });

  it("positions centroids on the unit sphere (before scaling)", () => {
    const centroids = generateCentroids(10);
    for (const c of centroids) {
      const mag = Math.sqrt(c.nx ** 2 + c.ny ** 2 + c.nz ** 2);
      expect(mag).toBeCloseTo(1.0, 4);
    }
  });
});

describe("getCentroidPosition", () => {
  it("scales centroid normals by IVF_RADIUS", () => {
    const centroids = generateCentroids(5);
    for (const c of centroids) {
      const pos = getCentroidPosition(c);
      expect(pos).toBeInstanceOf(THREE.Vector3);
      const mag = pos.length();
      expect(mag).toBeCloseTo(IVF_RADIUS, 2);
    }
  });

  it("returns a THREE.Vector3", () => {
    const centroids = generateCentroids(1);
    const pos = getCentroidPosition(centroids[0]);
    expect(pos.x).toBeDefined();
    expect(pos.y).toBeDefined();
    expect(pos.z).toBeDefined();
  });
});

describe("generateClusteredPoints", () => {
  it("returns approximately the requested total number of points", () => {
    const centroids = generateCentroids(5);
    const points = generateClusteredPoints(centroids, 100);
    expect(points).toHaveLength(100);
  });

  it("assigns sequential IDs", () => {
    const centroids = generateCentroids(3);
    const points = generateClusteredPoints(centroids, 30);
    for (let i = 0; i < 30; i++) {
      expect(points[i].id).toBe(i);
    }
  });

  it("assigns each point to a valid centroid", () => {
    const centroids = generateCentroids(5);
    const points = generateClusteredPoints(centroids, 50);
    const validIds = new Set(centroids.map((c) => c.id));

    for (const p of points) {
      expect(validIds.has(p.centroidId)).toBe(true);
    }
  });

  it("distributes points roughly equally across clusters", () => {
    const centroids = generateCentroids(4);
    const points = generateClusteredPoints(centroids, 100);

    const counts = new Map<number, number>();
    for (const p of points) {
      counts.set(p.centroidId, (counts.get(p.centroidId) ?? 0) + 1);
    }

    // 100 points / 4 clusters = 25 each
    for (const [, count] of counts) {
      expect(count).toBe(25);
    }
  });

  it("positions points near their assigned centroid", () => {
    const centroids = generateCentroids(5);
    const clusterSpread = 1.5;
    const points = generateClusteredPoints(centroids, 100, clusterSpread);

    for (const p of points) {
      const centroid = centroids.find((c) => c.id === p.centroidId)!;
      const centroidPos = getCentroidPosition(centroid);
      const dist = p.position.distanceTo(centroidPos);
      // Distance should be within clusterSpread
      expect(dist).toBeLessThanOrEqual(clusterSpread + 0.001);
    }
  });

  it("stores offset from centroid", () => {
    const centroids = generateCentroids(3);
    const points = generateClusteredPoints(centroids, 30);

    for (const p of points) {
      expect(p.offset).toBeInstanceOf(THREE.Vector3);
      expect(p.offset.length()).toBeLessThanOrEqual(1.5 + 0.001);
    }
  });

  it("respects custom cluster spread parameter", () => {
    const centroids = generateCentroids(3);
    const spread = 3.0;
    const points = generateClusteredPoints(centroids, 60, spread);

    for (const p of points) {
      expect(p.offset.length()).toBeLessThanOrEqual(spread + 0.001);
    }
  });
});

describe("findNearestCentroids", () => {
  it("returns nprobe centroids", () => {
    const centroids = generateCentroids(10);
    const query = new THREE.Vector3(12, 0, 0);
    const nearest = findNearestCentroids(query, centroids, 3);
    expect(nearest).toHaveLength(3);
  });

  it("returns the closest centroid first", () => {
    const centroids = generateCentroids(10);
    const query = getCentroidPosition(centroids[0]); // query at centroid 0
    const nearest = findNearestCentroids(query, centroids, 1);
    expect(nearest[0].id).toBe(centroids[0].id);
  });

  it("returns results sorted by distance (ascending)", () => {
    const centroids = generateCentroids(10);
    const query = new THREE.Vector3(12, 0, 0);
    const nearest = findNearestCentroids(query, centroids, 5);

    for (let i = 1; i < nearest.length; i++) {
      const distPrev = query.distanceTo(getCentroidPosition(nearest[i - 1]));
      const distCurr = query.distanceTo(getCentroidPosition(nearest[i]));
      expect(distPrev).toBeLessThanOrEqual(distCurr + 0.0001);
    }
  });

  it("limits results to centroid count if nprobe > nlist", () => {
    const centroids = generateCentroids(5);
    const query = new THREE.Vector3(0, 0, 0);
    const nearest = findNearestCentroids(query, centroids, 100);
    expect(nearest).toHaveLength(5);
  });
});

describe("generateClusterBoundaries", () => {
  it("returns an array of boundary edges", () => {
    const centroids = generateCentroids(5);
    const boundaries = generateClusterBoundaries(centroids);
    expect(boundaries.length).toBeGreaterThan(0);
  });

  it("each boundary has from, to, color1, color2", () => {
    const centroids = generateCentroids(5);
    const boundaries = generateClusterBoundaries(centroids);

    for (const b of boundaries) {
      expect(b.from).toBeInstanceOf(THREE.Vector3);
      expect(b.to).toBeInstanceOf(THREE.Vector3);
      expect(typeof b.color1).toBe("number");
      expect(typeof b.color2).toBe("number");
    }
  });

  it("produces more boundaries with more centroids", () => {
    const small = generateClusterBoundaries(generateCentroids(3));
    const large = generateClusterBoundaries(generateCentroids(10));
    expect(large.length).toBeGreaterThan(small.length);
  });
});

describe("calculateIVFMetrics", () => {
  const baseCase = {
    vectorCount: 100000,
    dimensions: 768,
    nlist: 100,
    nprobe: 10,
  };

  it("calculates vector storage correctly (N * d * 4)", () => {
    const metrics = calculateIVFMetrics(
      baseCase.vectorCount,
      baseCase.dimensions,
      baseCase.nlist,
      baseCase.nprobe
    );
    expect(metrics.vectorStorageBytes).toBe(100000 * 768 * 4);
  });

  it("calculates centroid storage correctly (nlist * d * 4)", () => {
    const metrics = calculateIVFMetrics(
      baseCase.vectorCount,
      baseCase.dimensions,
      baseCase.nlist,
      baseCase.nprobe
    );
    expect(metrics.centroidStorageBytes).toBe(100 * 768 * 4);
  });

  it("calculates inverted list storage correctly (N * 8)", () => {
    const metrics = calculateIVFMetrics(
      baseCase.vectorCount,
      baseCase.dimensions,
      baseCase.nlist,
      baseCase.nprobe
    );
    expect(metrics.invertedListsBytes).toBe(100000 * 8);
  });

  it("total storage is sum of all components", () => {
    const metrics = calculateIVFMetrics(
      baseCase.vectorCount,
      baseCase.dimensions,
      baseCase.nlist,
      baseCase.nprobe
    );
    expect(metrics.totalStorageBytes).toBe(
      metrics.vectorStorageBytes +
        metrics.centroidStorageBytes +
        metrics.invertedListsBytes
    );
  });

  it("recall increases with higher nprobe", () => {
    const low = calculateIVFMetrics(100000, 768, 100, 1);
    const mid = calculateIVFMetrics(100000, 768, 100, 10);
    const high = calculateIVFMetrics(100000, 768, 100, 50);

    expect(mid.recall).toBeGreaterThan(low.recall);
    expect(high.recall).toBeGreaterThan(mid.recall);
  });

  it("recall is capped at 0.99", () => {
    const metrics = calculateIVFMetrics(100000, 768, 10, 10);
    expect(metrics.recall).toBeLessThanOrEqual(0.99);
  });

  it("build time increases with vector count", () => {
    const small = calculateIVFMetrics(1000, 768, 100, 10);
    const large = calculateIVFMetrics(1000000, 768, 100, 10);
    expect(large.buildTimeSeconds).toBeGreaterThan(small.buildTimeSeconds);
  });

  it("query latency increases with nprobe", () => {
    const low = calculateIVFMetrics(100000, 768, 100, 1);
    const high = calculateIVFMetrics(100000, 768, 100, 50);
    expect(high.queryLatencyMs).toBeGreaterThan(low.queryLatencyMs);
  });

  it("returns all expected metric fields", () => {
    const metrics = calculateIVFMetrics(
      baseCase.vectorCount,
      baseCase.dimensions,
      baseCase.nlist,
      baseCase.nprobe
    );
    expect(metrics).toHaveProperty("vectorStorageBytes");
    expect(metrics).toHaveProperty("centroidStorageBytes");
    expect(metrics).toHaveProperty("invertedListsBytes");
    expect(metrics).toHaveProperty("totalStorageBytes");
    expect(metrics).toHaveProperty("buildTimeSeconds");
    expect(metrics).toHaveProperty("queryLatencyMs");
    expect(metrics).toHaveProperty("recall");
  });
});
