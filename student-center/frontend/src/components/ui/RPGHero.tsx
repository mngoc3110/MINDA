"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { KeyboardControls, useKeyboardControls, Html, Sparkles, Box, Sphere } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { ArrowDown } from "lucide-react";

// Hệ thống Điều hướng của Người chơi & Camera
function Scene() {
  const [, getKeys] = useKeyboardControls();
  const playerRef = useRef<THREE.Group>(null);
  const cameraTarget = new THREE.Vector3();

  useFrame((state, delta) => {
    const { forward, backward, left, right } = getKeys();
    
    // Tốc độ di chuyển
    const speed = 8 * delta;
    if (playerRef.current) {
      if (forward) playerRef.current.position.z -= speed;
      if (backward) playerRef.current.position.z += speed;
      if (left) playerRef.current.position.x -= speed;
      if (right) playerRef.current.position.x += speed;

      // Giới hạn bản đồ (-15 đến 15)
      playerRef.current.position.x = THREE.MathUtils.clamp(playerRef.current.position.x, -15, 15);
      playerRef.current.position.z = THREE.MathUtils.clamp(playerRef.current.position.z, -15, 15);

      // Thêm hiệu ứng nhấp nhô lơ lửng cho nhân vật
      playerRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.1;

      // Camera bám theo Player góc nghiêng Isometric (từ trên nhìn chéo xuống)
      cameraTarget.copy(playerRef.current.position);
      state.camera.position.lerp(new THREE.Vector3(cameraTarget.x, cameraTarget.y + 12, cameraTarget.z + 14), 0.05);
      state.camera.lookAt(cameraTarget);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={2} color="#c7d2fe" castShadow />
      
      {/* Nhân vật chính (Drone năng lượng) */}
      <group ref={playerRef} position={[0, 0.5, 12]}>
        <Sphere args={[0.5, 32, 32]} castShadow>
          <meshStandardMaterial color="#818cf8" emissive="#4f46e5" emissiveIntensity={2} />
        </Sphere>
        <pointLight color="#818cf8" intensity={5} distance={10} />
      </group>

      {/* Sàn Cửu Long Cyberpunk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#020202" roughness={0.9} />
      </mesh>
      {/* Lưới tọa độ Toán học ngầu lòi */}
      <gridHelper args={[40, 40, "#4f46e5", "#1e1b4b"]} position={[0, 0, 0]} />

      {/* Các Trạm Địa điểm (Locations) trên Bản đồ */}
      <LocationPoint position={[-6, 1, -2]} color="#ec4899" title="Thư Viện Bài Giảng" />
      <LocationPoint position={[5, 1.5, -6]} color="#22d3ee" title="Lõi AI RAPT-CLIP" />
      <LocationPoint position={[0, 1, -10]} color="#f59e0b" title="Hội trường Xếp Hạng" />
      <LocationPoint position={[8, 1, 4]} color="#a855f7" title="Phòng Thực Hành 3D" />
      
      <Sparkles count={800} scale={30} size={1.5} speed={0.2} opacity={0.4} color="#c7d2fe" />
    </>
  );
}

// Chướng ngại vật và Biển báo trạm
function LocationPoint({ position, color, title }: { position: [number, number, number], color: string, title: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Khối năng lượng của Trạm */}
      <Box ref={ref} args={[1.5, 2.5, 1.5]} castShadow>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} wireframe />
      </Box>
      <pointLight color={color} intensity={2} distance={8} />
      
      {/* Tag nổi lên của Trạm */}
      <Html position={[0, 2.5, 0]} center distanceFactor={15}>
        <div className="px-4 py-1.5 bg-black/80 backdrop-blur-md text-white text-xs font-bold whitespace-nowrap rounded-lg border border-white/20 select-none pointer-events-none drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          {title}
        </div>
      </Html>
    </group>
  );
}

export default function RPGHero() {
  return (
    <div className="w-full h-[100vh] relative bg-[#020202] overflow-hidden">
      
      {/* Màn hình HUD Hướng dẫn của Game (Lớp mặt) */}
      <div className="absolute top-32 left-8 z-10 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 p-5 rounded-2xl text-white shadow-2xl">
          <h2 className="text-xl font-black mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">VŨ TRỤ MINDA EDU</h2>
          <p className="text-xs font-medium text-gray-300 uppercase tracking-widest mb-4">Sử dụng bàn phím để di chuyển</p>
          <div className="flex flex-col items-center gap-1 opacity-70">
            <span className="w-10 h-10 rounded-lg bg-white/10 border-b-2 border-white/20 flex items-center justify-center font-bold font-mono text-lg">W</span>
            <div className="flex gap-1">
              <span className="w-10 h-10 rounded-lg bg-white/10 border-b-2 border-white/20 flex items-center justify-center font-bold font-mono text-lg">A</span>
              <span className="w-10 h-10 rounded-lg bg-white/10 border-b-2 border-white/20 flex items-center justify-center font-bold font-mono text-lg">S</span>
              <span className="w-10 h-10 rounded-lg bg-white/10 border-b-2 border-white/20 flex items-center justify-center font-bold font-mono text-lg">D</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mũi tên nháy Cuộn Xuống y như yêu cầu */}
      <div className="absolute top-1/2 right-12 z-10 -translate-y-1/2 flex flex-col items-center gap-3">
        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
           <span className="text-[10px] uppercase tracking-[0.2em] text-white font-bold">Khám phá<br/>Lớp học</span>
        </div>
        <div className="w-12 h-16 rounded-full border-2 border-indigo-500/30 flex items-center justify-center bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          <ArrowDown className="w-6 h-6 text-indigo-400 animate-[bounce_1.5s_infinite]" />
        </div>
      </div>

      {/* Động cơ Game */}
      <KeyboardControls
        map={[
          { name: "forward", keys: ["ArrowUp", "w", "W"] },
          { name: "backward", keys: ["ArrowDown", "s", "S"] },
          { name: "left", keys: ["ArrowLeft", "a", "A"] },
          { name: "right", keys: ["ArrowRight", "d", "D"] },
        ]}
      >
        <Canvas shadows className="cursor-crosshair active:cursor-move">
          <Scene />
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
