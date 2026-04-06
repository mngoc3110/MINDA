"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, ContactShadows, Text } from "@react-three/drei";
import { useState } from "react";
import * as THREE from "three";

type ShapeType = "cube" | "sphere" | "cone" | "torus" | "cylinder";

export default function Math3DViewer() {
  const [shape, setShape] = useState<ShapeType>("cone");

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden relative shadow-sm">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 z-10">
        <h2 className="text-xl font-bold font-outfit text-slate-800">Phòng Thí nghiệm Toán học 3D</h2>
        <div className="flex gap-2">
          {(["cube", "sphere", "cone", "cylinder"] as ShapeType[]).map((type) => (
            <button
              key={type}
              onClick={() => setShape(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                shape === type 
                  ? "bg-indigo-600 text-white" 
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-indigo-600"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full relative bg-radial from-slate-50 to-slate-200">
        <div className="absolute top-4 left-4 z-10 text-xs font-semibold text-indigo-700 bg-indigo-100/80 px-3 py-1.5 rounded-full border border-indigo-200 backdrop-blur-md shadow-sm">
           Chuột trái: Xoay | Cuộn chuột: Phóng to/Thu nhỏ | Chuột phải: Di chuyển
        </div>
        
        <Canvas camera={{ position: [4, 3, 5], fov: 45 }}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
          <Environment preset="city" />

          {/* Core object */}
          <group position={[0, 0, 0]}>
            <mesh castShadow receiveShadow>
              {shape === "cube" && <boxGeometry args={[2, 2, 2]} />}
              {shape === "sphere" && <sphereGeometry args={[1.5, 32, 32]} />}
              {shape === "cone" && <coneGeometry args={[1.5, 3, 32]} />}
              {shape === "cylinder" && <cylinderGeometry args={[1.2, 1.2, 3, 32]} />}
              {shape === "torus" && <torusGeometry args={[1.2, 0.4, 16, 100]} />}
              
              <meshPhysicalMaterial 
                color="#6366f1" 
                roughness={0.2} 
                metalness={0.1} 
                clearcoat={0.8}
                clearcoatRoughness={0.2}
              />
            </mesh>
            
            {/* Wireframe overlay for mathematical feel */}
            <mesh>
              {shape === "cube" && <boxGeometry args={[2.01, 2.01, 2.01]} />}
              {shape === "sphere" && <sphereGeometry args={[1.51, 16, 16]} />}
              {shape === "cone" && <coneGeometry args={[1.51, 3.01, 16]} />}
              {shape === "cylinder" && <cylinderGeometry args={[1.21, 1.21, 3.01, 16]} />}
              <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.15} />
            </mesh>
          </group>

          {/* Mathematical grid base */}
          <Grid 
            position={[0, -1.5, 0]} 
            args={[10.5, 10.5]} 
            cellSize={0.5} 
            cellThickness={0.5} 
            cellColor="#cbd5e1" 
            sectionSize={2.5} 
            sectionThickness={1.5} 
            sectionColor="#6366f1" 
            fadeDistance={25} 
            fadeStrength={1} 
          />
          
          {/* Axes Helper inside Scene */}
          <primitive object={new THREE.AxesHelper(3)} position={[-2, -1.49, -2]} />
          
          <ContactShadows position={[0, -1.49, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
          
          <OrbitControls 
            makeDefault 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 + 0.1}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>
      </div>
    </div>
  );
}
