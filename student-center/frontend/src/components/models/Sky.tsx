"use client";
import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function Sky({ isRotating }: { isRotating: boolean }) {
  const sky = useGLTF("/3d/sky.glb");
  const skyRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (isRotating && skyRef.current) {
      skyRef.current.rotation.y += 0.25 * delta; 
    }
  });

  return (
    <mesh ref={skyRef} scale={[500, 500, 500]}>
      <primitive object={sky.scene} />
    </mesh>
  );
}
