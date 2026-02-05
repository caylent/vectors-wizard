"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import {
  generateHNSWData,
  getNodePosition,
  LAYER_RADII,
  LAYER_COLORS,
  EDGE_COLORS,
  MAX_LAYERS,
  type HNSWNode,
  type HNSWEdge,
} from "@/lib/visualization/hnsw-layout";
import { useIndexStore } from "@/stores/indexStore";
import { useVisualizationStore } from "@/stores/visualizationStore";

interface LayerShellProps {
  layer: number;
  visible: boolean;
  animate?: boolean;
}

function LayerShell({ layer, visible, animate = true }: LayerShellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const radius = LAYER_RADII[layer];
  const detail = layer === 0 ? 3 : 2;
  const opacity = layer === 0 ? 0.04 : 0.06 + layer * 0.02;

  useEffect(() => {
    if (animate && meshRef.current) {
      meshRef.current.scale.setScalar(0);
      gsap.to(meshRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.6,
        delay: layer * 0.1,
        ease: "elastic.out(1, 0.5)",
      });
    }
  }, [animate, layer]);

  if (!visible) return null;

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[radius, detail]} />
      <meshBasicMaterial
        color={LAYER_COLORS[layer as keyof typeof LAYER_COLORS]}
        wireframe
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

interface NodeMeshProps {
  node: HNSWNode;
  layer: number;
  animate?: boolean;
}

function NodeMesh({ node, layer, animate = true }: NodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const position = useMemo(() => getNodePosition(node, layer), [node, layer]);
  const radius = 0.12 + layer * 0.1;
  const isMaxLayer = layer === node.layer;

  useEffect(() => {
    if (animate && meshRef.current) {
      meshRef.current.scale.setScalar(0);
      gsap.to(meshRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.35,
        delay: layer * 0.04 + Math.random() * 0.2,
        ease: "back.out(2)",
      });
    }
  }, [animate, layer]);

  // Breathing animation for high-layer nodes
  useFrame(({ clock }) => {
    if (meshRef.current && isMaxLayer && node.layer >= 2) {
      const scale = 1 + Math.sin(clock.elapsedTime * 2 + node.id) * 0.08;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      userData={{ nodeId: node.id, layer, maxLayer: node.layer }}
    >
      <sphereGeometry args={[radius, 12, 8]} />
      <meshPhongMaterial
        color={LAYER_COLORS[layer as keyof typeof LAYER_COLORS]}
        emissive={LAYER_COLORS[layer as keyof typeof LAYER_COLORS]}
        emissiveIntensity={isMaxLayer ? 0.5 : 0.15}
        transparent={!isMaxLayer}
        opacity={isMaxLayer ? 1 : 0.25}
      />
    </mesh>
  );
}

interface EdgeLineProps {
  edge: HNSWEdge;
  nodes: HNSWNode[];
  animate?: boolean;
  index: number;
}

function EdgeLine({ edge, nodes, animate = true, index }: EdgeLineProps) {
  const [opacity, setOpacity] = useState(animate ? 0 : edge.layer >= 2 ? 0.4 : 0.18);
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  const curvePoints = useMemo(() => {
    if (!sourceNode || !targetNode) return [];

    const p1 = getNodePosition(sourceNode, edge.layer);
    const p2 = getNodePosition(targetNode, edge.layer);

    // Create curved line by pushing midpoint outward
    const mid = new THREE.Vector3(
      (p1.x + p2.x) * 0.5 * 1.05,
      (p1.y + p2.y) * 0.5 * 1.05,
      (p1.z + p2.z) * 0.5 * 1.05
    );

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(p1.x, p1.y, p1.z),
      mid,
      new THREE.Vector3(p2.x, p2.y, p2.z)
    );

    return curve.getPoints(12);
  }, [sourceNode, targetNode, edge.layer]);

  const targetOpacity = edge.layer >= 2 ? 0.4 : 0.18;
  const color = edge.layer >= 2 ? EDGE_COLORS.highlight : EDGE_COLORS.default;

  useEffect(() => {
    if (animate) {
      const delay = 150 + index * 2;
      const timeout = setTimeout(() => {
        setOpacity(targetOpacity);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [animate, targetOpacity, index]);

  if (curvePoints.length === 0) return null;

  return (
    <Line
      points={curvePoints}
      color={color}
      transparent
      opacity={opacity}
      lineWidth={1}
    />
  );
}

interface RadialPillarProps {
  node: HNSWNode;
}

function RadialPillar({ node }: RadialPillarProps) {
  const points = useMemo(() => {
    const inner = getNodePosition(node, node.layer);
    const outer = getNodePosition(node, 0);
    return [
      new THREE.Vector3(inner.x, inner.y, inner.z),
      new THREE.Vector3(outer.x, outer.y, outer.z),
    ];
  }, [node]);

  return (
    <Line
      points={points}
      color={0x1a2a3a}
      transparent
      opacity={0.15}
      lineWidth={1}
    />
  );
}

export function HNSWVisualization() {
  const M = useIndexStore((s) => s.hnsw.M);
  const visualNodeCount = useVisualizationStore((s) => s.visualNodeCount);

  // Generate graph data
  const { nodes, edges } = useMemo(() => {
    return generateHNSWData(visualNodeCount, M);
  }, [visualNodeCount, M]);

  // Track layers that have nodes
  const layersWithNodes = useMemo(() => {
    const layers = new Set<number>();
    nodes.forEach((n) => {
      for (let l = 0; l <= n.layer; l++) {
        layers.add(l);
      }
    });
    return layers;
  }, [nodes]);

  // Use M in key to trigger animation when M changes
  return (
    <group key={`hnsw-${M}-${visualNodeCount}`}>
      {/* Layer shells */}
      {Array.from({ length: MAX_LAYERS }).map((_, layer) => (
        <LayerShell
          key={`shell-${layer}`}
          layer={layer}
          visible={layersWithNodes.has(layer)}
          animate
        />
      ))}

      {/* Nodes - render all layer instances */}
      {nodes.map((node) =>
        Array.from({ length: node.layer + 1 }).map((_, layer) => (
          <NodeMesh
            key={`node-${node.id}-${layer}`}
            node={node}
            layer={layer}
            animate
          />
        ))
      )}

      {/* Radial pillars for multi-layer nodes */}
      {nodes
        .filter((n) => n.layer > 0)
        .map((node) => (
          <RadialPillar key={`pillar-${node.id}`} node={node} />
        ))}

      {/* Edges */}
      {edges.map((edge, idx) => (
        <EdgeLine
          key={`edge-${edge.source}-${edge.target}-${edge.layer}`}
          edge={edge}
          nodes={nodes}
          animate
          index={idx}
        />
      ))}
    </group>
  );
}
