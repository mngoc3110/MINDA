"use client";
import { a } from "@react-spring/three";
import { useRef, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export function Island({
  season = "spring",
  ...props
}: {
  season?: "spring" | "summer" | "autumn" | "winter";
  [key: string]: any;
}) {
  const islandRef = useRef<THREE.Group>(null);
  const { nodes, materials } = useGLTF("/3d/island.glb") as any;

  // Cloned material with seasonal tinting
  const seasonMaterial = useMemo(() => {
    if (!materials || !materials.PaletteMaterial001) return null;
    const mat = materials.PaletteMaterial001.clone();
    if (season === "autumn") {
      mat.color = new THREE.Color("#ffb480");
    } else if (season === "winter") {
      mat.color = new THREE.Color("#e2f1ff");
    } else if (season === "summer") {
      mat.color = new THREE.Color("#b5ffb2");
    } else {
      mat.color = new THREE.Color("#ffffff");
    }
    return mat;
  }, [materials, season]);

  if (!nodes || !materials) return null;

  const mat = seasonMaterial || materials.PaletteMaterial001;

  return (
    <a.group ref={islandRef as any} {...props}>
      <mesh geometry={nodes.polySurface944_tree_body_0.geometry} material={mat} />
      <mesh geometry={nodes.polySurface945_tree1_0.geometry} material={mat} />
      <mesh geometry={nodes.polySurface946_tree2_0.geometry} material={mat} />
      <mesh geometry={nodes.polySurface947_tree1_0.geometry} material={mat} />
      <mesh geometry={nodes.polySurface948_tree_body_0.geometry} material={mat} />
      <mesh geometry={nodes.polySurface949_tree_body_0.geometry} material={mat} />
      <mesh geometry={nodes.pCube11_rocks1_0.geometry} material={mat} />
    </a.group>
  );
}
