"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import {
  generateCentroids,
  generateClusteredPoints,
  getCentroidPosition,
  IVF_RADIUS,
  type IVFCentroid,
  type IVFPoint,
} from "@/lib/visualization/ivf-layout";
import { useIndexStore } from "@/stores/indexStore";
import { useVisualizationStore } from "@/stores/visualizationStore";

interface CentroidMeshProps {
  centroid: IVFCentroid;
  isProbed?: boolean;
  animate?: boolean;
}

function CentroidMesh({ centroid, isProbed = false, animate = true }: CentroidMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const position = useMemo(() => getCentroidPosition(centroid), [centroid]);

  useEffect(() => {
    if (animate && meshRef.current) {
      meshRef.current.scale.setScalar(0);
      gsap.to(meshRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.5,
        delay: centroid.id * 0.05,
        ease: "elastic.out(1, 0.5)",
      });
    }
  }, [animate, centroid.id]);

  // Pulsing animation for probed centroids
  useFrame(({ clock }) => {
    if (meshRef.current && isProbed) {
      const scale = 1.2 + Math.sin(clock.elapsedTime * 4) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
    >
      {/* Octahedron for centroids */}
      <octahedronGeometry args={[0.5, 0]} />
      <meshPhongMaterial
        color={centroid.color}
        emissive={centroid.color}
        emissiveIntensity={isProbed ? 0.8 : 0.4}
        transparent
        opacity={isProbed ? 1 : 0.8}
        wireframe={!isProbed}
      />
    </mesh>
  );
}

interface ClusterPointProps {
  point: IVFPoint;
  color: number;
  isSearched?: boolean;
  animate?: boolean;
}

function ClusterPoint({ point, color, isSearched = false, animate = true }: ClusterPointProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (animate && meshRef.current) {
      meshRef.current.scale.setScalar(0);
      gsap.to(meshRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3,
        delay: Math.random() * 0.5,
        ease: "back.out(2)",
      });
    }
  }, [animate]);

  return (
    <mesh
      ref={meshRef}
      position={[point.position.x, point.position.y, point.position.z]}
    >
      <sphereGeometry args={[0.08, 8, 6]} />
      <meshPhongMaterial
        color={isSearched ? 0x34d399 : color}
        emissive={isSearched ? 0x34d399 : color}
        emissiveIntensity={isSearched ? 0.6 : 0.2}
        transparent
        opacity={isSearched ? 1 : 0.6}
      />
    </mesh>
  );
}

interface ClusterBoundaryProps {
  centroid: IVFCentroid;
  animate?: boolean;
}

function ClusterBoundary({ centroid, animate = true }: ClusterBoundaryProps) {
  const [opacity, setOpacity] = useState(animate ? 0 : 0.15);
  const position = useMemo(() => getCentroidPosition(centroid), [centroid]);

  useEffect(() => {
    if (animate) {
      const timeout = setTimeout(() => setOpacity(0.15), centroid.id * 50 + 200);
      return () => clearTimeout(timeout);
    }
  }, [animate, centroid.id]);

  return (
    <mesh position={[position.x, position.y, position.z]}>
      <icosahedronGeometry args={[1.8, 1]} />
      <meshBasicMaterial
        color={centroid.color}
        wireframe
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

function GlobalSphere() {
  return (
    <mesh>
      <icosahedronGeometry args={[IVF_RADIUS, 2]} />
      <meshBasicMaterial
        color={0x4da6ff}
        wireframe
        transparent
        opacity={0.03}
      />
    </mesh>
  );
}

export function IVFVisualization() {
  const { nlist, nprobe } = useIndexStore((s) => s.ivf);
  const visualNodeCount = useVisualizationStore((s) => s.visualNodeCount);

  // Limit visual clusters for performance
  const visualClusters = Math.min(nlist, 20);

  // Generate cluster data
  const centroids = useMemo(() => {
    return generateCentroids(visualClusters);
  }, [visualClusters]);

  const points = useMemo(() => {
    return generateClusteredPoints(centroids, visualNodeCount, 1.5);
  }, [centroids, visualNodeCount]);

  // Derive probed clusters from nprobe (no need for state)
  const probedClusters = useMemo(() => {
    const probed = new Set<number>();
    const visualProbe = Math.min(nprobe, visualClusters);
    for (let i = 0; i < visualProbe; i++) {
      probed.add(i);
    }
    return probed;
  }, [nprobe, visualClusters]);

  // Use nlist in key to trigger animation when parameter changes
  return (
    <group key={`ivf-${nlist}-${visualNodeCount}`}>
      {/* Global sphere boundary */}
      <GlobalSphere />

      {/* Cluster boundaries */}
      {centroids.map((centroid) => (
        <ClusterBoundary
          key={`boundary-${centroid.id}`}
          centroid={centroid}
          animate
        />
      ))}

      {/* Centroids */}
      {centroids.map((centroid) => (
        <CentroidMesh
          key={`centroid-${centroid.id}`}
          centroid={centroid}
          isProbed={probedClusters.has(centroid.id)}
          animate
        />
      ))}

      {/* Clustered points */}
      {points.map((point) => {
        const centroid = centroids.find((c) => c.id === point.centroidId);
        if (!centroid) return null;

        return (
          <ClusterPoint
            key={`point-${point.id}`}
            point={point}
            color={centroid.color}
            isSearched={probedClusters.has(point.centroidId)}
            animate
          />
        );
      })}
    </group>
  );
}
