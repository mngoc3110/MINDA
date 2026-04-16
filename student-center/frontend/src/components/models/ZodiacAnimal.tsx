"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface ZodiacAnimalProps {
  currentAnimation?: string;
  onClick?: () => void;
  isIntro?: boolean;
  isControllable?: boolean;
  orbitRadius?: number;
  orbitY?: number;
  [key: string]: any;
}

export function ZodiacAnimal({
  currentAnimation = "idle",
  onClick,
  isIntro = false,
  isControllable = false,
  orbitRadius = 8,
  orbitY = 0,
  ...props
}: ZodiacAnimalProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/3d/fox.glb");
  const { actions } = useAnimations(animations, group);
  const { camera } = useThree();

  // Intro state
  const [hasReachedRight, setHasReachedRight] = useState(false);

  // Controllable state: angle on orbit, direction facing
  const angle = useRef(0); // radians around island center
  const keysPressed = useRef<Set<string>>(new Set());
  const [isMoving, setIsMoving] = useState(false);

  // Initialize intro position
  useEffect(() => {
    if (isIntro && group.current) {
      group.current.position.x = -15;
    }
  }, [isIntro]);

  // Keyboard listeners for controllable mode
  useEffect(() => {
    if (!isControllable) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s"].includes(key)) {
        e.preventDefault();
        keysPressed.current.add(key);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isControllable]);

  useFrame((state, delta) => {
    // ── INTRO MODE: chạy từ trái sang phải ──
    if (isIntro && !isControllable) {
      if (!hasReachedRight && group.current) {
        if (group.current.position.x < 3.5) {
          group.current.position.x += 10 * delta;
        } else {
          setHasReachedRight(true);
        }
      } else if (hasReachedRight && group.current) {
        const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, -0.5, 0));
        group.current.quaternion.slerp(targetQ, 0.05);
      }
      return;
    }

    // ── CONTROLLABLE MODE: di chuyển trên quỹ đạo tròn quanh đảo ──
    if (isControllable && group.current) {
      const keys = keysPressed.current;
      const moveSpeed = 1.5 * delta;
      let moving = false;

      // Left/Right: xoay trên quỹ đạo
      if (keys.has("arrowleft") || keys.has("a")) {
        angle.current += moveSpeed;
        moving = true;
      }
      if (keys.has("arrowright") || keys.has("d")) {
        angle.current -= moveSpeed;
        moving = true;
      }

      // Vị trí trên quỹ đạo tròn
      const x = Math.sin(angle.current) * orbitRadius;
      const z = Math.cos(angle.current) * orbitRadius;
      group.current.position.set(x, orbitY, z);

      // Mặt con vật hướng theo hướng di chuyển (tiếp tuyến đường tròn)
      const tangentAngle = angle.current + Math.PI / 2;
      group.current.rotation.y = tangentAngle;

      setIsMoving(moving);

      // Camera follow — nhìn con vật từ phía sau
      const camDistance = 12;
      const camHeight = 5;
      const camX = Math.sin(angle.current) * (orbitRadius + camDistance);
      const camZ = Math.cos(angle.current) * (orbitRadius + camDistance);
      const targetCamPos = new THREE.Vector3(camX, orbitY + camHeight, camZ);
      camera.position.lerp(targetCamPos, 0.05);
      camera.lookAt(x, orbitY + 1, z);
    }
  });

  // Animation switching
  useEffect(() => {
    Object.values(actions).forEach((action) => action?.stop());

    let targetAnim = currentAnimation;
    if (isIntro && !isControllable) {
      targetAnim = hasReachedRight ? "idle" : "walk";
    } else if (isControllable) {
      targetAnim = isMoving ? "walk" : "idle";
    }

    const findAnim = (keywords: string[]) => {
      for (const key of Object.keys(actions)) {
        if (keywords.some((k) => key.toLowerCase().includes(k))) return actions[key];
      }
      return null;
    };

    let act = findAnim([targetAnim]);
    if (!act && targetAnim === "walk") act = findAnim(["run", "move", "walk"]);
    if (!act) act = findAnim(["idle"]);
    if (!act) act = actions[Object.keys(actions)[0]];

    act?.play();
  }, [actions, currentAnimation, isIntro, hasReachedRight, isControllable, isMoving]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <group
      ref={group}
      {...props}
      dispose={null}
      onClick={handlePointerDown}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (onClick) document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "auto";
      }}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/3d/fox.glb");
