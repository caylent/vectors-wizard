/**
 * Tests for HNSW layout algorithms
 *
 * Validates layer assignment, node positioning, edge generation,
 * neighbor queries, and the overall data generation pipeline.
 */
import { describe, it, expect } from "vitest";
import {
  assignLayers,
  getNodePosition,
  generateEdges,
  getNeighbors,
  generateHNSWData,
  LAYER_RADII,
  MAX_LAYERS,
  LAYER_COLORS,
  EDGE_COLORS,
  type HNSWNode,
} from "../hnsw-layout";
import { generateFibonacciSphere } from "../fibonacci-sphere";

describe("constants", () => {
  it("defines 4 layer radii, largest first (outer = L0)", () => {
    expect(LAYER_RADII).toHaveLength(4);
    // L0 (base/outer) should be the largest radius
    expect(LAYER_RADII[0]).toBeGreaterThan(LAYER_RADII[1]);
    expect(LAYER_RADII[1]).toBeGreaterThan(LAYER_RADII[2]);
    expect(LAYER_RADII[2]).toBeGreaterThan(LAYER_RADII[3]);
  });

  it("MAX_LAYERS equals length of LAYER_RADII", () => {
    expect(MAX_LAYERS).toBe(LAYER_RADII.length);
  });

  it("defines colors for all 4 layers", () => {
    for (let i = 0; i < MAX_LAYERS; i++) {
      expect(LAYER_COLORS[i as keyof typeof LAYER_COLORS]).toBeDefined();
    }
  });

  it("defines all needed edge color variants", () => {
    expect(EDGE_COLORS.default).toBeDefined();
    expect(EDGE_COLORS.highlight).toBeDefined();
    expect(EDGE_COLORS.query).toBeDefined();
    expect(EDGE_COLORS.explored).toBeDefined();
    expect(EDGE_COLORS.searchPath).toBeDefined();
  });
});

describe("assignLayers", () => {
  it("assigns a layer to every point", () => {
    const points = generateFibonacciSphere(30);
    const nodes = assignLayers(points, 4);
    expect(nodes).toHaveLength(30);
    for (const node of nodes) {
      expect(node.layer).toBeGreaterThanOrEqual(0);
      expect(node.layer).toBeLessThan(MAX_LAYERS);
    }
  });

  it("preserves the original FibonacciPoint properties", () => {
    const points = generateFibonacciSphere(10);
    const nodes = assignLayers(points, 4);
    for (let i = 0; i < 10; i++) {
      expect(nodes[i].nx).toBe(points[i].nx);
      expect(nodes[i].ny).toBe(points[i].ny);
      expect(nodes[i].nz).toBe(points[i].nz);
      expect(nodes[i].id).toBe(i);
    }
  });

  it("assigns most nodes to layer 0 (base)", () => {
    const points = generateFibonacciSphere(100);
    const nodes = assignLayers(points, 4);
    const layer0Only = nodes.filter((n) => n.layer === 0);
    // With M=4 and ln(M) ~ 1.386, mL ~ 0.72
    // Most nodes should be layer 0 (about 50%+ with these parameters)
    expect(layer0Only.length).toBeGreaterThan(30);
  });

  it("guarantees at least one node at layer >= 2", () => {
    const points = generateFibonacciSphere(20);
    const nodes = assignLayers(points, 4);
    const maxLayer = Math.max(...nodes.map((n) => n.layer));
    expect(maxLayer).toBeGreaterThanOrEqual(2);
  });

  it("guarantees at least one node at layer 3 when count > 15", () => {
    const points = generateFibonacciSphere(30);
    const nodes = assignLayers(points, 4);
    const maxLayer = Math.max(...nodes.map((n) => n.layer));
    expect(maxLayer).toBeGreaterThanOrEqual(3);
  });

  it("is deterministic (uses seed-based pseudo-random)", () => {
    const points = generateFibonacciSphere(50);
    const a = assignLayers(points, 8);
    const b = assignLayers(points, 8);
    for (let i = 0; i < 50; i++) {
      expect(a[i].layer).toBe(b[i].layer);
    }
  });

  it("produces higher layers more often with smaller M", () => {
    // Smaller M => larger mL => higher probability of upper layers
    const points = generateFibonacciSphere(100);
    const nodesM2 = assignLayers(points, 2);
    const nodesM16 = assignLayers(points, 16);

    const avgLayerM2 =
      nodesM2.reduce((sum, n) => sum + n.layer, 0) / nodesM2.length;
    const avgLayerM16 =
      nodesM16.reduce((sum, n) => sum + n.layer, 0) / nodesM16.length;

    // Lower M should mean higher average layer
    expect(avgLayerM2).toBeGreaterThan(avgLayerM16);
  });

  it("caps layer at MAX_LAYERS - 1", () => {
    const points = generateFibonacciSphere(100);
    // M=2 gives very high mL, so many nodes would go above MAX_LAYERS
    const nodes = assignLayers(points, 2);
    for (const node of nodes) {
      expect(node.layer).toBeLessThan(MAX_LAYERS);
    }
  });
});

describe("getNodePosition", () => {
  it("scales the node unit normal by the layer radius", () => {
    const node: HNSWNode = { id: 0, layer: 2, nx: 1, ny: 0, nz: 0 };
    const pos = getNodePosition(node, 0); // L0 radius = 13
    expect(pos.x).toBeCloseTo(13, 5);
    expect(pos.y).toBe(0);
    expect(pos.z).toBe(0);
  });

  it("returns different positions for the same node at different layers", () => {
    const node: HNSWNode = { id: 0, layer: 3, nx: 0.5, ny: 0.5, nz: 0.707 };
    const posL0 = getNodePosition(node, 0);
    const posL3 = getNodePosition(node, 3);

    // L0 radius is 13, L3 radius is 3.5 => different magnitudes
    const magL0 = Math.sqrt(posL0.x ** 2 + posL0.y ** 2 + posL0.z ** 2);
    const magL3 = Math.sqrt(posL3.x ** 2 + posL3.y ** 2 + posL3.z ** 2);

    expect(magL0).toBeGreaterThan(magL3);
    expect(magL0 / magL3).toBeCloseTo(LAYER_RADII[0] / LAYER_RADII[3], 3);
  });

  it("positions at layer 0 lie on the outermost sphere", () => {
    const node: HNSWNode = {
      id: 0,
      layer: 0,
      nx: 1 / Math.sqrt(3),
      ny: 1 / Math.sqrt(3),
      nz: 1 / Math.sqrt(3),
    };
    const pos = getNodePosition(node, 0);
    const mag = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    expect(mag).toBeCloseTo(LAYER_RADII[0], 3);
  });
});

describe("generateEdges", () => {
  it("generates edges for a small graph", () => {
    const points = generateFibonacciSphere(10);
    const nodes = assignLayers(points, 4);
    const edges = generateEdges(nodes, 4);
    expect(edges.length).toBeGreaterThan(0);
  });

  it("creates no duplicate edges within the same layer", () => {
    const points = generateFibonacciSphere(30);
    const nodes = assignLayers(points, 4);
    const edges = generateEdges(nodes, 4);

    const keys = new Set<string>();
    for (const e of edges) {
      const key = `${Math.min(e.source, e.target)}-${Math.max(e.source, e.target)}-${e.layer}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }
  });

  it("creates more edges at layer 0 (2*M) than upper layers (M)", () => {
    const points = generateFibonacciSphere(45);
    const nodes = assignLayers(points, 4);
    const edges = generateEdges(nodes, 4);

    const layer0Edges = edges.filter((e) => e.layer === 0);
    const layer1Edges = edges.filter((e) => e.layer === 1);

    // Layer 0 has more nodes AND more edges per node
    // So it should have strictly more edges
    if (layer1Edges.length > 0) {
      expect(layer0Edges.length).toBeGreaterThan(layer1Edges.length);
    }
  });

  it("only references valid node IDs", () => {
    const points = generateFibonacciSphere(20);
    const nodes = assignLayers(points, 4);
    const edges = generateEdges(nodes, 4);
    const validIds = new Set(nodes.map((n) => n.id));

    for (const edge of edges) {
      expect(validIds.has(edge.source)).toBe(true);
      expect(validIds.has(edge.target)).toBe(true);
    }
  });

  it("only connects nodes that exist at the edge's layer", () => {
    const points = generateFibonacciSphere(30);
    const nodes = assignLayers(points, 4);
    const edges = generateEdges(nodes, 4);

    for (const edge of edges) {
      const sourceNode = nodes.find((n) => n.id === edge.source)!;
      const targetNode = nodes.find((n) => n.id === edge.target)!;
      expect(sourceNode.layer).toBeGreaterThanOrEqual(edge.layer);
      expect(targetNode.layer).toBeGreaterThanOrEqual(edge.layer);
    }
  });

  it("increases total edge count with higher M", () => {
    const points = generateFibonacciSphere(30);
    const nodesM2 = assignLayers(points, 2);
    const edgesM2 = generateEdges(nodesM2, 2);

    const nodesM8 = assignLayers(points, 8);
    const edgesM8 = generateEdges(nodesM8, 8);

    expect(edgesM8.length).toBeGreaterThan(edgesM2.length);
  });
});

describe("getNeighbors", () => {
  it("returns neighbors of a node at a given layer", () => {
    const { nodes, edges } = generateHNSWData(20, 4);
    // Find a node that exists at layer 0
    const testNode = nodes[0];
    const neighbors = getNeighbors(testNode.id, 0, edges, nodes);

    expect(neighbors.length).toBeGreaterThan(0);
    // All returned neighbors should have their layer >= 0
    for (const n of neighbors) {
      expect(n.layer).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns empty array for a node not present at that layer", () => {
    const { nodes, edges } = generateHNSWData(20, 4);
    // Find a node at layer 0 only
    const layer0Node = nodes.find((n) => n.layer === 0);
    if (layer0Node) {
      const neighbors = getNeighbors(layer0Node.id, 3, edges, nodes);
      expect(neighbors).toHaveLength(0);
    }
  });

  it("returns only HNSWNode objects (not undefined)", () => {
    const { nodes, edges } = generateHNSWData(30, 4);
    const neighbors = getNeighbors(0, 0, edges, nodes);
    for (const n of neighbors) {
      expect(n).toBeDefined();
      expect(typeof n.id).toBe("number");
      expect(typeof n.layer).toBe("number");
    }
  });
});

describe("generateHNSWData", () => {
  it("returns nodes and edges", () => {
    const { nodes, edges } = generateHNSWData(30, 4);
    expect(nodes).toHaveLength(30);
    expect(edges.length).toBeGreaterThan(0);
  });

  it("produces a connected layer-0 graph (most nodes reachable)", () => {
    const { nodes, edges } = generateHNSWData(30, 8);
    // BFS from node 0 at layer 0
    const visited = new Set<number>([0]);
    const queue = [0];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = getNeighbors(current, 0, edges, nodes);
      for (const n of neighbors) {
        if (!visited.has(n.id)) {
          visited.add(n.id);
          queue.push(n.id);
        }
      }
    }

    // With M=8 and 30 nodes, the graph should be well-connected
    expect(visited.size).toBeGreaterThan(20);
  });

  it("is deterministic", () => {
    const a = generateHNSWData(20, 4);
    const b = generateHNSWData(20, 4);

    expect(a.nodes.length).toBe(b.nodes.length);
    expect(a.edges.length).toBe(b.edges.length);

    for (let i = 0; i < a.nodes.length; i++) {
      expect(a.nodes[i].id).toBe(b.nodes[i].id);
      expect(a.nodes[i].layer).toBe(b.nodes[i].layer);
    }
  });
});
