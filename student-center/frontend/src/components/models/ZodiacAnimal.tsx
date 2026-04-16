"use client";
import { useEffect, useRef, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ZodiacAnimalProps {
  currentAnimation?: string;
  onClick?: () => void;
  isIntro?: boolean;
  [key: string]: any;
}

export function ZodiacAnimal({ currentAnimation = "idle", onClick, isIntro = false, ...props }: ZodiacAnimalProps) {
  const group = useRef<THREE.Group>(null);
  // Sử dụng fox.glb làm placeholder cho con giáp. (Có thể thay bằng horse.glb sau này bằng cách truyền prop node/scene khác hoặc sửa đường dẫn)
  const { scene, animations } = useGLTF("/3d/fox.glb");
  const { actions } = useAnimations(animations, group);

  const [hasReachedRight, setHasReachedRight] = useState(false);

  // Initialize intro position
  useEffect(() => {
     if (isIntro && group.current) {
        group.current.position.x = -15; // Bắt đầu ở bên trái xa
     }
  }, [isIntro]);

  useFrame((state, delta) => {
    if (isIntro && !hasReachedRight && group.current) {
       // Di chuyển từ trái qua phải
       if (group.current.position.x < 3.5) { // Dừng lại ở góc phải
          group.current.position.x += 10 * delta; // Tốc độ chạy
       } else {
          setHasReachedRight(true);
       }
    } else if (isIntro && hasReachedRight && group.current) {
        // Xoay nhẹ mặt về phía camera sau khi đến nơi
        const targetRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, -0.5, 0));
        group.current.quaternion.slerp(targetRotation, 0.05);
    }
  });

  useEffect(() => {
    // Play animation
    Object.values(actions).forEach((action) => action?.stop());
    
    let targetAnim = currentAnimation;
    if (isIntro && !hasReachedRight) targetAnim = "walk";
    else if (isIntro && hasReachedRight) targetAnim = "idle";

    // find animation
    const findAnim = (keywords: string[]) => {
       for (const key of Object.keys(actions)) {
          if (keywords.some(k => key.toLowerCase().includes(k))) return actions[key];
       }
       return null;
    }
    
    let act = findAnim([targetAnim]);
    if (!act && targetAnim === "walk") act = findAnim(["run", "move", "walk"]);
    if (!act) act = findAnim(["idle"]); // fallback
    if (!act) act = actions[Object.keys(actions)[0]];
    
    act?.play();
  }, [actions, currentAnimation, isIntro, hasReachedRight]);

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
