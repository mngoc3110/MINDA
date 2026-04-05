"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, TorusKnot, Sparkles, Float, MeshDistortMaterial } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function AnimatedShape() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      {/* Khối Torus Knot tượng trưng cho não bộ AI và Không gian Toán học */}
      <TorusKnot ref={meshRef} args={[1.4, 0.45, 256, 64]} scale={1.2}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.4}
          speed={1.5}
          roughness={0.1}
          metalness={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive="#312e81"
          emissiveIntensity={0.5}
        />
      </TorusKnot>
    </Float>
  );
}

export default function ThreeHero() {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        {/* Ánh sáng đa chiều mượt mà */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={2.5} color="#c7d2fe" />
        <directionalLight position={[-10, -10, -5]} intensity={1.5} color="#e879f9" />
        
        {/* Khối Trung tâm */}
        <AnimatedShape />
        
        {/* Hạt năng lượng (Particles) */}
        <Sparkles count={250} scale={10} size={2.5} speed={0.5} opacity={0.8} color="#818cf8" />
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
