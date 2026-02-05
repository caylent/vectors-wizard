"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import {
  getNodePosition,
  getNeighbors,
  LAYER_RADII,
  EDGE_COLORS,
  type HNSWNode,
  type HNSWEdge,
} from "@/lib/visualization/hnsw-layout";
import { useVisualizationStore } from "@/stores/visualizationStore";
import { useIndexStore } from "@/stores/indexStore";

// Helper to convert position object to Vector3
function toVec3(pos: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(pos.x, pos.y, pos.z);
}

interface GlowSphereProps {
  position: THREE.Vector3;
  color: number;
  radius?: number;
  opacity?: number;
  pulse?: boolean;
}

function GlowSphere({ position, color, radius = 0.4, opacity = 0.8, pulse = false }: GlowSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current && pulse) {
      const material = meshRef.current.material as THREE.MeshPhongMaterial;
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = 0.4 + Math.sin(clock.elapsedTime * 4) * 0.2;
      }
    }
  });

  useEffect(() => {
    if (meshRef.current) {
      gsap.from(meshRef.current.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.4,
        ease: "back.out(2)",
      });
    }
  }, []);

  return (
    <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
      <sphereGeometry args={[radius, 14, 10]} />
      <meshPhongMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.7}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

interface SearchPathProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: number;
}

function SearchPath({ from, to, color }: SearchPathProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const anim = { val: 0 };
    gsap.to(anim, {
      val: 1,
      duration: 0.2,
      ease: "power2.out",
      onUpdate: () => {
        setProgress(anim.val);
      }
    });
  }, []);

  const currentTo = from.clone().lerp(to, progress);

  return (
    <Line
      points={[from, currentTo]}
      color={color}
      lineWidth={3}
      transparent
      opacity={0.9}
    />
  );
}

interface HNSWSearchAnimationProps {
  nodes: HNSWNode[];
  edges: HNSWEdge[];
  isActive: boolean;
  onComplete?: () => void;
}

export function HNSWSearchAnimation({
  nodes,
  edges,
  isActive,
  onComplete,
}: HNSWSearchAnimationProps) {
  const efSearch = useIndexStore((s) => s.hnsw.efSearch);
  const { setIsSearching, setSearchPath } = useVisualizationStore();

  const [queryPosition, setQueryPosition] = useState<THREE.Vector3 | null>(null);
  const [targetNode, setTargetNode] = useState<HNSWNode | null>(null);
  const [searchPaths, setSearchPaths] = useState<Array<{ from: THREE.Vector3; to: THREE.Vector3; color: number }>>([]);
  const [exploredNodes, setExploredNodes] = useState<Array<{ node: HNSWNode; layer: number; color: number }>>([]);
  const [, setFound] = useState(false);

  const runSearch = useCallback(async () => {
    if (!isActive || nodes.length === 0) return;

    // Reset state
    setSearchPaths([]);
    setExploredNodes([]);
    setFound(false);

    // Pick random target
    const target = nodes[Math.floor(Math.random() * nodes.length)];
    setTargetNode(target);

    // Query position outside the structure
    const qDir = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();
    const qPos = qDir.multiplyScalar(LAYER_RADII[0] + 3);
    setQueryPosition(qPos);

    // Entry: highest layer node
    const entry = nodes.reduce((best, n) => (n.layer > best.layer ? n : best), nodes[0]);
    const topLayer = Math.max(...nodes.map((n) => n.layer));

    let current = entry;
    const visited = new Set<number>([current.id]);
    const paths: Array<{ from: THREE.Vector3; to: THREE.Vector3; color: number }> = [];
    const explored: Array<{ node: HNSWNode; layer: number; color: number }> = [];

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const dist = (a: HNSWNode, b: HNSWNode) => {
      const p1 = toVec3(getNodePosition(a, 0));
      const p2 = toVec3(getNodePosition(b, 0));
      return p1.distanceTo(p2);
    };

    // Phase 1: Greedy descent through upper layers
    for (let layer = topLayer; layer > 0; layer--) {
      let improved = true;
      while (improved) {
        improved = false;
        const neighbors = getNeighbors(current.id, layer, edges, nodes);

        for (const neighbor of neighbors) {
          if (dist(neighbor, target) < dist(current, target)) {
            // Add path
            const from = toVec3(getNodePosition(current, layer));
            const to = toVec3(getNodePosition(neighbor, layer));
            paths.push({ from, to, color: EDGE_COLORS.searchPath });
            setSearchPaths([...paths]);

            // Add explored node
            explored.push({ node: neighbor, layer, color: EDGE_COLORS.query });
            setExploredNodes([...explored]);

            visited.add(neighbor.id);
            current = neighbor;
            improved = true;
            await sleep(100);
            break;
          }
        }
      }

      // Descend to next layer
      const from = toVec3(getNodePosition(current, layer));
      const to = toVec3(getNodePosition(current, layer - 1));
      paths.push({ from, to, color: EDGE_COLORS.searchPath });
      setSearchPaths([...paths]);
      await sleep(150);
    }

    // Phase 2: Layer 0 beam search
    const candidates: Array<{ node: HNSWNode; dist: number }> = [
      { node: current, dist: dist(current, target) },
    ];
    const l0Visited = new Set<number>([current.id]);
    let exploredCount = 0;

    while (candidates.length > 0 && exploredCount < efSearch) {
      candidates.sort((a, b) => a.dist - b.dist);
      const { node: closest } = candidates.shift()!;
      exploredCount++;

      if (closest.id !== current.id) {
        const from = toVec3(getNodePosition(current, 0));
        const to = toVec3(getNodePosition(closest, 0));
        paths.push({ from, to, color: EDGE_COLORS.explored });
        setSearchPaths([...paths]);

        explored.push({ node: closest, layer: 0, color: EDGE_COLORS.explored });
        setExploredNodes([...explored]);
      }

      visited.add(closest.id);
      current = closest;

      const neighbors = getNeighbors(closest.id, 0, edges, nodes);
      for (const neighbor of neighbors) {
        if (!l0Visited.has(neighbor.id)) {
          l0Visited.add(neighbor.id);
          candidates.push({ node: neighbor, dist: dist(neighbor, target) });
        }
      }

      await sleep(35);
    }

    const wasFound = visited.has(target.id);
    setFound(wasFound);
    setSearchPath(Array.from(visited));

    await sleep(2000);
    onComplete?.();
    setIsSearching(false);
  }, [isActive, nodes, edges, efSearch, onComplete, setIsSearching, setSearchPath]);

  useEffect(() => {
    if (isActive) {
      // Use setTimeout to avoid React 19 strict mode warning about setState in effects
      const timeoutId = setTimeout(() => runSearch(), 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isActive, runSearch]);

  if (!isActive) return null;

  return (
    <group>
      {/* Query sphere */}
      {queryPosition && (
        <GlowSphere position={queryPosition} color={EDGE_COLORS.query} radius={0.4} pulse />
      )}

      {/* Target highlight */}
      {targetNode && (
        <GlowSphere
          position={toVec3(getNodePosition(targetNode, 0))}
          color={0xf87171}
          radius={0.45}
          opacity={0.5}
          pulse
        />
      )}

      {/* Search paths */}
      {searchPaths.map((path, idx) => (
        <SearchPath key={idx} from={path.from} to={path.to} color={path.color} />
      ))}

      {/* Explored node highlights */}
      {exploredNodes.map((item, idx) => (
        <GlowSphere
          key={`explored-${idx}`}
          position={toVec3(getNodePosition(item.node, item.layer))}
          color={item.color}
          radius={0.28}
          opacity={0.6}
        />
      ))}
    </group>
  );
}
