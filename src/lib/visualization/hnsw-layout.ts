/**
 * HNSW-specific layout algorithms
 *
 * Handles layer assignment, edge generation, and node positioning
 * for visualizing HNSW index structure.
 */

import { FibonacciPoint, generateFibonacciSphere, sphereDistance } from "./fibonacci-sphere";

// Layer radii: inner = high layer (sparse entry), outer = layer 0 (dense base)
export const LAYER_RADII = [13, 9.5, 6.5, 3.5]; // L0=outer, L3=inner
export const MAX_LAYERS = 4;

// Layer colors
export const LAYER_COLORS = {
  0: 0x4da6ff, // Blue - Base layer
  1: 0xa78bfa, // Purple - Layer 1
  2: 0xf59e0b, // Orange - Layer 2
  3: 0xf87171, // Red - Layer 3 (entry)
} as const;

// Edge colors
export const EDGE_COLORS = {
  default: 0x2a3a52,
  highlight: 0x4a5a72,
  query: 0xfbbf24,
  explored: 0x34d399,
  searchPath: 0xfbbf24,
} as const;

export interface HNSWNode extends FibonacciPoint {
  id: number;
  layer: number; // Maximum layer this node appears in
}

export interface HNSWEdge {
  source: number;
  target: number;
  layer: number;
}

/**
 * Assign HNSW layers to nodes based on the probabilistic layer distribution
 *
 * In HNSW, nodes are inserted with a probability of appearing in higher layers
 * based on the formula: layer = floor(-ln(random) * mL)
 * where mL = 1 / ln(M)
 */
export function assignLayers(points: FibonacciPoint[], M: number): HNSWNode[] {
  const mL = 1 / Math.log(Math.max(M, 2));

  const nodes = points.map((point, id) => {
    // Use deterministic "random" based on node id for reproducibility
    const seed = Math.abs(Math.sin(id * 9301 + 49297) * 0.5 + 0.5);
    const layer = Math.floor(-Math.log(Math.max(seed, 0.001)) * mL);

    return {
      ...point,
      id,
      layer: Math.min(layer, MAX_LAYERS - 1),
    };
  });

  // Ensure we have at least one node at layer 2
  const maxLayer = Math.max(...nodes.map((n) => n.layer));
  if (maxLayer < 2) {
    nodes[0].layer = 2;
  }

  // Ensure we have at least one node at layer 3 if enough nodes
  if (maxLayer < 3 && nodes.length > 15) {
    const candidate = nodes.find((n) => n.layer === 2 && n.id !== 0);
    if (candidate) {
      candidate.layer = 3;
    }
  }

  return nodes;
}

/**
 * Get the 3D position of a node at a specific layer
 */
export function getNodePosition(
  node: HNSWNode,
  layer: number
): { x: number; y: number; z: number } {
  const radius = LAYER_RADII[layer];
  return {
    x: node.nx * radius,
    y: node.ny * radius,
    z: node.nz * radius,
  };
}

/**
 * Generate edges for the HNSW graph
 *
 * Each layer connects nodes to their nearest neighbors.
 * Layer 0 has 2*M connections, upper layers have M connections.
 */
export function generateEdges(nodes: HNSWNode[], M: number): HNSWEdge[] {
  const edges: HNSWEdge[] = [];
  const seen = new Set<string>();

  for (let layer = 0; layer < MAX_LAYERS; layer++) {
    // Get all nodes that exist at this layer (nodes with maxLayer >= layer)
    const layerNodes = nodes.filter((n) => n.layer >= layer);
    if (layerNodes.length < 2) continue;

    // Max edges: 2*M for layer 0, M for upper layers
    const maxEdges = layer === 0
      ? Math.min(M * 2, layerNodes.length - 1)
      : Math.min(M, layerNodes.length - 1);

    layerNodes.forEach((node) => {
      // Sort other nodes by distance
      const sorted = layerNodes
        .filter((n) => n.id !== node.id)
        .map((n) => ({
          node: n,
          dist: sphereDistance(node, n, LAYER_RADII[layer], LAYER_RADII[layer]),
        }))
        .sort((a, b) => a.dist - b.dist);

      // Connect to nearest neighbors
      for (let i = 0; i < Math.min(maxEdges, sorted.length); i++) {
        const targetId = sorted[i].node.id;
        const key = `${Math.min(node.id, targetId)}-${Math.max(node.id, targetId)}-${layer}`;

        if (!seen.has(key)) {
          seen.add(key);
          edges.push({
            source: node.id,
            target: targetId,
            layer,
          });
        }
      }
    });
  }

  return edges;
}

/**
 * Get neighbors of a node at a specific layer
 */
export function getNeighbors(
  nodeId: number,
  layer: number,
  edges: HNSWEdge[],
  nodes: HNSWNode[]
): HNSWNode[] {
  return edges
    .filter(
      (e) =>
        e.layer === layer && (e.source === nodeId || e.target === nodeId)
    )
    .map((e) => (e.source === nodeId ? e.target : e.source))
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is HNSWNode => n !== undefined);
}

/**
 * Generate HNSW visualization data from parameters
 */
export function generateHNSWData(nodeCount: number, M: number) {
  const fibPoints = generateFibonacciSphere(nodeCount);
  const nodes = assignLayers(fibPoints, M);
  const edges = generateEdges(nodes, M);

  return { nodes, edges };
}
