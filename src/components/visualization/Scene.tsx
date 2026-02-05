"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense, type ReactNode } from "react";
import { useVisualizationStore } from "@/stores/visualizationStore";

interface SceneProps {
  children: ReactNode;
}

function Lighting() {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.25} />

      {/* Key light from above-right */}
      <directionalLight position={[20, 30, 20]} intensity={0.6} />

      {/* Blue accent light */}
      <pointLight position={[0, 0, 0]} color="#4da6ff" intensity={0.5} distance={40} />

      {/* Purple accent light from below-left */}
      <pointLight position={[-10, -5, 10]} color="#a78bfa" intensity={0.3} distance={35} />
    </>
  );
}

function CameraControls() {
  const autoRotate = useVisualizationStore((s) => s.autoRotate);

  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.05}
      autoRotate={autoRotate}
      autoRotateSpeed={0.3}
      minDistance={10}
      maxDistance={60}
    />
  );
}

function Starfield() {
  return (
    <Stars
      radius={100}
      depth={50}
      count={3000}
      factor={4}
      saturation={0}
      fade
      speed={0.5}
    />
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#4da6ff" wireframe />
    </mesh>
  );
}

export function Scene({ children }: SceneProps) {
  return (
    <div id="canvas-container" className="absolute inset-0">
      <Canvas
        camera={{
          position: [22, 12, 22],
          fov: 50,
          near: 0.1,
          far: 500,
        }}
        gl={{
          antialias: true,
          toneMapping: 1, // ACESFilmicToneMapping
          toneMappingExposure: 1.4,
        }}
        dpr={[1, 2]}
      >
        {/* Dark space background */}
        <color attach="background" args={["#020408"]} />

        <Suspense fallback={<LoadingFallback />}>
          <Lighting />
          <CameraControls />
          <Starfield />
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
