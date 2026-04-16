"use client";
import { a } from "@react-spring/three";
import { useEffect, useRef, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ZodiacAnimal } from "./ZodiacAnimal";

export function Island({
  isRotating,
  setIsRotating,
  setCurrentStage,
  season = "spring",
  showZodiac = false,
  ...props
}: {
  isRotating: boolean;
  setIsRotating: (val: boolean) => void;
  setCurrentStage?: (val: number | null) => void;
  season?: "spring" | "summer" | "autumn" | "winter";
  showZodiac?: boolean;
  [key: string]: any;
}) {
  const islandRef = useRef<THREE.Group>(null);
  const { gl, viewport } = useThree();
  const { nodes, materials } = useGLTF("/3d/island.glb") as any;

  // Use cloned material for seasonal tinting
  const seasonMaterial = useMemo(() => {
    if (!materials || !materials.PaletteMaterial001) return null;
    const mat = materials.PaletteMaterial001.clone();
    if (season === "autumn") {
      mat.color = new THREE.Color("#ffb480"); // cam lá vàng
    } else if (season === "winter") {
      mat.color = new THREE.Color("#e2f1ff"); // xanh tuyết
    } else if (season === "summer") {
        mat.color = new THREE.Color("#b5ffb2"); // xanh tươi nắng
    } else {
      mat.color = new THREE.Color("#ffffff"); // nguyên bản mùa xuân
    }
    return mat;
  }, [materials, season]);

  const lastX = useRef(0);
  const rotationSpeed = useRef(0);
  const dampingFactor = 0.95;

  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    event.preventDefault();
    setIsRotating(true);
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    lastX.current = clientX;
  };

  const handlePointerUp = (event: any) => {
    event.stopPropagation();
    event.preventDefault();
    setIsRotating(false);
  };

  const handlePointerMove = (event: any) => {
    event.stopPropagation();
    event.preventDefault();
    if (isRotating && islandRef.current) {
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const delta = (clientX - lastX.current) / viewport.width;
      islandRef.current.rotation.y += delta * 0.01 * Math.PI;
      lastX.current = clientX;
      rotationSpeed.current = delta * 0.01 * Math.PI;
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      if (!isRotating) setIsRotating(true);
      if (islandRef.current) islandRef.current.rotation.y += 0.005 * Math.PI;
      rotationSpeed.current = 0.007;
    } else if (event.key === "ArrowRight") {
      if (!isRotating) setIsRotating(true);
      if (islandRef.current) islandRef.current.rotation.y -= 0.005 * Math.PI;
      rotationSpeed.current = -0.007;
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      setIsRotating(false);
    }
  };

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gl, isRotating, handlePointerDown, handlePointerUp, handlePointerMove]); 

  useFrame(() => {
    if (!islandRef.current) return;
    if (!isRotating) {
      rotationSpeed.current *= dampingFactor;
      if (Math.abs(rotationSpeed.current) < 0.001) rotationSpeed.current = 0;
      islandRef.current.rotation.y += rotationSpeed.current;
    } else {
      if (setCurrentStage) {
        const rotation = islandRef.current.rotation.y;
        const normalizedRotation = ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        switch (true) {
          case normalizedRotation >= 5.45 && normalizedRotation <= 5.85: setCurrentStage(4); break;
          case normalizedRotation >= 0.85 && normalizedRotation <= 1.3: setCurrentStage(3); break;
          case normalizedRotation >= 2.4 && normalizedRotation <= 2.6: setCurrentStage(2); break;
          case normalizedRotation >= 4.25 && normalizedRotation <= 4.75: setCurrentStage(1); break;
          default: setCurrentStage(null);
        }
      }
    }
  });

  if (!nodes || !materials) return null;

  return (
    <a.group ref={islandRef as any} {...props}>
      <mesh geometry={nodes.polySurface944_tree_body_0.geometry} material={seasonMaterial || materials.PaletteMaterial001} />
      <mesh geometry={nodes.polySurface945_tree1_0.geometry} material={seasonMaterial || materials.PaletteMaterial001} />
      <mesh geometry={nodes.polySurface946_tree2_0.geometry} material={seasonMaterial || materials.PaletteMaterial001} />
      <mesh geometry={nodes.polySurface947_tree1_0.geometry} material={seasonMaterial || materials.PaletteMaterial001} />
      <mesh geometry={nodes.polySurface948_tree_body_0.geometry} material={seasonMaterial || materials.PaletteMaterial001} />
      <mesh geometry={nodes.polySurface949_tree_body_0.geometry} material={seasonMaterial || materials.PaletteMaterial001} />
      <mesh geometry={nodes.pCube11_rocks1_0.geometry} material={seasonMaterial || materials.PaletteMaterial001} />
      
      {showZodiac && (
        <ZodiacAnimal 
          position={[0, 0, 1.5]} 
          scale={[0.5, 0.5, 0.5]} 
          rotation={[0, 0, 0]}
        />
      )}
    </a.group>
  );
}
