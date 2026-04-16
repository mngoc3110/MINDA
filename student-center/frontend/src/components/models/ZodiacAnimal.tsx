"use client";
import { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface ZodiacAnimalProps {
  currentAnimation?: string;
  onClick?: () => void;
  [key: string]: any;
}

export function ZodiacAnimal({ currentAnimation = "idle", onClick, ...props }: ZodiacAnimalProps) {
  const group = useRef<THREE.Group>(null);
  // Sử dụng fox.glb làm placeholder cho con giáp. (Có thể thay bằng horse.glb sau này bằng cách truyền prop node/scene khác hoặc sửa đường dẫn)
  const { scene, animations } = useGLTF("/3d/fox.glb");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Play animation
    Object.values(actions).forEach((action) => action?.stop());
    if (actions[currentAnimation]) {
      actions[currentAnimation]?.play();
    } else if (actions["idle"] || actions["Idle"] || actions[Object.keys(actions)[0]]) {
       // if exact name not found, try common names or first animation
       const act = actions["idle"] || actions["Idle"] || actions[Object.keys(actions)[0]];
       act?.play();
    }
  }, [actions, currentAnimation]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <group ref={group} {...props} dispose={null} onClick={handlePointerDown} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }} onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; }}>
      <primitive object={scene} />
    </group>
  );
}

// Preload to ensure smooth rendering
useGLTF.preload("/3d/fox.glb");
