/**
 * IVF (Inverted File Index) layout algorithms
 *
 * Visual metaphor: Voronoi-style cluster galaxies with octahedron centroids
 * and wireframe cluster boundaries.
 */

import * as THREE from "three";
import { generateFibonacciSphere, type FibonacciPoint } from "./fibonacci-sphere";

// Visual constants
export const IVF_RADIUS = 12;
export const CLUSTER_COLORS = [
  0x4da6ff, // Blue
  0xa78bfa, // Purple
  0xf59e0b, // Orange
  0x34d399, // Green
  0xf87171, // Red
  0xfbbf24, // Yellow
  0x60a5fa, // Light blue
  0xc084fc, // Light purple
  0xfb923c, // Light orange
  0x4ade80, // Light green
];

export interface IVFCentroid extends FibonacciPoint {
  id: number;
  color: number;
}

export interface IVFPoint {
  id: number;
  centroidId: number;
  position: THREE.Vector3;
  offset: THREE.Vector3; // Offset from centroid
}

/**
 * Generate IVF cluster centroids distributed on a sphere
 */
export function generateCentroids(nlist: number): IVFCentroid[] {
  const fibPoints = generateFibonacciSphere(nlist);

  return fibPoints.map((point, id) => ({
    ...point,
    id,
    color: CLUSTER_COLORS[id % CLUSTER_COLORS.length],
  }));
}

/**
 * Get 3D position of a centroid
 */
export function getCentroidPosition(centroid: IVFCentroid): THREE.Vector3 {
  return new THREE.Vector3(
    centroid.nx * IVF_RADIUS,
    centroid.ny * IVF_RADIUS,
    centroid.nz * IVF_RADIUS
  );
}

/**
 * Generate points clustered around centroids
 * Each centroid has roughly equal number of points
 */
export function generateClusteredPoints(
  centroids: IVFCentroid[],
  totalPoints: number,
  clusterSpread: number = 1.5
): IVFPoint[] {
  const points: IVFPoint[] = [];
  const pointsPerCluster = Math.floor(totalPoints / centroids.length);
  const remainder = totalPoints % centroids.length;

  let pointId = 0;

  centroids.forEach((centroid, clusterIdx) => {
    const numPoints = pointsPerCluster + (clusterIdx < remainder ? 1 : 0);
    const centroidPos = getCentroidPosition(centroid);

    for (let i = 0; i < numPoints; i++) {
      // Generate random offset within cluster radius
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * clusterSpread;

      const offset = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      points.push({
        id: pointId++,
        centroidId: centroid.id,
        position: centroidPos.clone().add(offset),
        offset,
      });
    }
  });

  return points;
}

/**
 * Find the nearest centroid to a query point
 */
export function findNearestCentroids(
  queryPos: THREE.Vector3,
  centroids: IVFCentroid[],
  nprobe: number
): IVFCentroid[] {
  const distances = centroids.map((c) => ({
    centroid: c,
    distance: queryPos.distanceTo(getCentroidPosition(c)),
  }));

  distances.sort((a, b) => a.distance - b.distance);

  return distances.slice(0, Math.min(nprobe, centroids.length)).map((d) => d.centroid);
}

/**
 * Generate Voronoi-like boundary edges between adjacent clusters
 * These are approximate and for visualization purposes
 */
export function generateClusterBoundaries(
  centroids: IVFCentroid[],
  _numEdges: number = 50
): Array<{ from: THREE.Vector3; to: THREE.Vector3; color1: number; color2: number }> {
  const edges: Array<{ from: THREE.Vector3; to: THREE.Vector3; color1: number; color2: number }> = [];

  // For each pair of adjacent centroids, create a boundary line
  // We'll use a simple nearest-neighbor approach
  centroids.forEach((c1, i) => {
    const pos1 = getCentroidPosition(c1);

    // Find the 3-4 nearest neighbors
    const neighbors = centroids
      .filter((_, j) => j !== i)
      .map((c2) => ({
        centroid: c2,
        distance: pos1.distanceTo(getCentroidPosition(c2)),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);

    neighbors.forEach(({ centroid: c2 }) => {
      // Only add edge once (when i < j)
      if (c1.id < c2.id) {
        const pos2 = getCentroidPosition(c2);
        const midpoint = pos1.clone().add(pos2).multiplyScalar(0.5);

        // Normalize to sphere surface
        midpoint.normalize().multiplyScalar(IVF_RADIUS);

        edges.push({
          from: pos1.clone().lerp(midpoint, 0.3),
          to: midpoint,
          color1: c1.color,
          color2: c2.color,
        });
      }
    });
  });

  return edges;
}

/**
 * Calculate IVF-specific metrics
 */
export interface IVFMetrics {
  vectorStorageBytes: number;
  centroidStorageBytes: number;
  invertedListsBytes: number;
  totalStorageBytes: number;
  buildTimeSeconds: number;
  queryLatencyMs: number;
  recall: number;
}

export function calculateIVFMetrics(
  vectorCount: number,
  dimensions: number,
  nlist: number,
  nprobe: number
): IVFMetrics {
  // Vector storage: N × d × 4 bytes
  const vectorStorageBytes = vectorCount * dimensions * 4;

  // Centroid storage: nlist × d × 4 bytes
  const centroidStorageBytes = nlist * dimensions * 4;

  // Inverted lists: N × 8 bytes (id + offset pointer)
  const invertedListsBytes = vectorCount * 8;

  const totalStorageBytes = vectorStorageBytes + centroidStorageBytes + invertedListsBytes;

  // Build time: O(N × nlist × iterations) for k-means
  const iterations = 10; // typical
  const buildTimeSeconds = (vectorCount * nlist * iterations * dimensions) / 1e9;

  // Query latency: scan nprobe/nlist fraction of data
  const scanFraction = nprobe / nlist;
  const queryLatencyMs = scanFraction * (vectorCount / 1e6) * dimensions * 0.001;

  // Recall: improves with nprobe, diminishes past sqrt(nlist)
  const optimalNprobe = Math.sqrt(nlist);
  const recall = Math.min(0.99, 1 - Math.exp(-2 * nprobe / optimalNprobe));

  return {
    vectorStorageBytes,
    centroidStorageBytes,
    invertedListsBytes,
    totalStorageBytes,
    buildTimeSeconds,
    queryLatencyMs,
    recall,
  };
}
