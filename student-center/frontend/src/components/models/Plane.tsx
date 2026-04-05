"use client";
import { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

export function Plane({ isRotating, ...props }: { isRotating: boolean; [key: string]: any }) {
  const ref = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/3d/plane.glb");
  const { actions } = useAnimations(animations, ref);

  useEffect(() => {
    if (isRotating) {
      if (actions["Take 001"]) actions["Take 001"].play();
    } else {
      if (actions["Take 001"]) actions["Take 001"].stop();
    }
  }, [actions, isRotating]);

  return (
    <group {...props} ref={ref}>
      <primitive object={scene} />
    </group>
  );
}
