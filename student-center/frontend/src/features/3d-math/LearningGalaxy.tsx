"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Sparkles, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { PlayCircle, FileText, Camera } from "lucide-react";
import { useHandTracking } from "@/hooks/useHandTracking";

function MilestoneStar({ data, initialPosition, globalHoveredId, draggedId, activeId }: any) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const targetInitialVec = useMemo(() => new THREE.Vector3(...initialPosition), [initialPosition]);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Pulse animation
      const scale = 1 + Math.sin(clock.getElapsedTime() * 3 + data.id) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }

    // Elastic Physics: Khi thả tay ra (không còn bị gắp), hành tinh tự bay về vị trí quỹ đạo cũ đầy ma thuật!
    if (groupRef.current && draggedId !== data.id) {
       groupRef.current.position.lerp(targetInitialVec, 0.1);
    }
  });

  const isForceHovered = globalHoveredId === data.id; // Đang bị chiếu tia Laser (Virtual Hover)
  const isDragged = draggedId === data.id; // Đang bị chụm tay giữ (Pinch & Hold)
  const isActive = activeId === data.id; // Đã Click chụm tay 1 lần (Toggle Open)

  // Hiện Tooltip chữ bền vững khi đã Click ghim (isActive), hoặc đang kéo thả (isDragged) hoặc chuột rê
  const showTooltip = hovered || isDragged || isActive;

  return (
    <group ref={groupRef} position={initialPosition} userData={{ id: data.id, isRootStarGroup: true }}>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
        <mesh 
          ref={meshRef}
          onPointerOver={() => setHovered(true)} 
          onPointerOut={() => setHovered(false)}
          userData={{ id: data.id, isStar: true }}
        >
          <sphereGeometry args={[0.4, 32, 32]} />
          {/* Phát sáng cực mạnh để người dùng biết họ đã tương tác thành công */}
          <meshStandardMaterial 
            color={data.color} 
            emissive={data.color} 
            emissiveIntensity={(isDragged || isActive) ? 5 : (isForceHovered ? 2.5 : 1)} 
            toneMapped={false}
          />
        </mesh>
      </Float>

      {/* Tooltip HTML */}
      {showTooltip && (
        <Html center distanceFactor={15} zIndexRange={[100, 0]}>
          <div className="bg-[#0f1011]/90 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-3 w-64 animate-in fade-in zoom-in duration-200 pointer-events-none transform -translate-y-8">
            <div className={`p-2 rounded-lg bg-white/10 shrink-0`} style={{ color: data.color }}>
              {data.type === 'video' ? <PlayCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight drop-shadow-md">{data.title}</p>
              <p className="text-gray-400 text-xs mt-1">{data.date} • {data.type === "video" ? "+5 EXP" : "+20 EXP"}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Controller xử lý Raycaster khi có bàn tay
function AIHandController({ coords, isPinching, handGestures, setGlobalHoveredId, controlsRef, draggedId, setDraggedId, activeId, setActiveId }: any) {
  const { camera, raycaster, scene } = useThree();
  const pointer = new THREE.Vector2();
  const targetZ = useRef(12);
  const lastX = useRef<number | null>(null); // Track tay để xoay camera
  const targetAzimuth = useRef<number | null>(null); // Lưu góc xoay mục tiêu ảo để Lerp cho mượt
  
  const latestHoveredId = useRef<number | null>(null);
  const wasPinching = useRef(false);
  const coyoteTimeFrames = useRef(0);

  useFrame(() => {
    // 1. Controller Zoom
    if (handGestures?.isClosedHand) {
        targetZ.current = 6;
    } else if (handGestures?.isOpenHand) {
        targetZ.current = 25;
    } else {
        targetZ.current = 12;
    }

    const currentDist = camera.position.length();
    const newDist = THREE.MathUtils.lerp(currentDist, targetZ.current, 0.05);
    
    if (Math.abs(newDist - currentDist) > 0.05) {
       camera.position.setLength(newDist);
    }

    // 2. Quay Xoay Swipe 
    if (handGestures?.isOpenHand && coords && controlsRef?.current) {
        if (lastX.current !== null) {
            const deltaX = coords.normalizedX - lastX.current;
            if (Math.abs(deltaX) > 0.002) {
               const clampedDelta = THREE.MathUtils.clamp(deltaX, -0.15, 0.15);
               if (targetAzimuth.current === null) {
                   targetAzimuth.current = controlsRef.current.getAzimuthalAngle();
               }
               targetAzimuth.current = (targetAzimuth.current || 0) - clampedDelta * 6.0; 
            }
        }
        lastX.current = coords.normalizedX;
    } else {
        lastX.current = null;
        targetAzimuth.current = null;
    }

    const currentTargetAzimuth = targetAzimuth.current;
    if (currentTargetAzimuth !== null && controlsRef?.current) {
        const currentAngle = controlsRef.current.getAzimuthalAngle();
        const smoothedAngle = THREE.MathUtils.lerp(currentAngle, currentTargetAzimuth, 0.15);
        controlsRef.current.setAzimuthalAngle(smoothedAngle);
    }

    // 3. Xử lý Laser Click (Tự động nam châm bắt dính - Auto Aim)
    if (coords && coords.normalizedX !== 0) {
      const currentPointerX = coords.normalizedX;
      const currentPointerY = coords.normalizedY;

      pointer.x = currentPointerX;
      pointer.y = currentPointerY;
      raycaster.setFromCamera(pointer, camera);

      // Tính toán Auto-Aim: Phóng tất cả hành tinh lên màn hình 2D, chọn cái gần Pointer nhất!
      let closestStarId: number | null = null;
      let minScreenDist = Infinity;

      scene.traverse((node: any) => {
         if (node.userData?.isRootStarGroup && node.userData?.id !== undefined) {
             const worldPos = new THREE.Vector3();
             node.getWorldPosition(worldPos);

             // Lọc mặt phẳng: Đảm bảo hành tinh nằm trước mặt Camera
             const cameraToStar = worldPos.clone().sub(camera.position);
             const lookDir = new THREE.Vector3();
             camera.getWorldDirection(lookDir);
             
             if (cameraToStar.dot(lookDir) > 0) {
                 const screenPos = worldPos.clone().project(camera);
                 
                 // Khoảng cách trên khung hình 2D (NDC từ -1 tới 1)
                 const dx = screenPos.x - currentPointerX;
                 const dy = screenPos.y - currentPointerY;
                 const dist2D = Math.sqrt(dx * dx + dy * dy);

                 // Nam châm hút trong phạm vi 0.35 NDC (khoảng gần 1/5 màn hình)
                 if (dist2D < minScreenDist && dist2D < 0.35) {
                     minScreenDist = dist2D;
                     closestStarId = node.userData.id;
                 }
             }
         }
      });

      // Lưu Auto-Aim
      if (closestStarId !== null && !draggedId) {
         latestHoveredId.current = closestStarId;
         setGlobalHoveredId(closestStarId); // Phát sáng hành tinh được nam châm hút
         coyoteTimeFrames.current = 0; 
      } else if (!draggedId) {
         setGlobalHoveredId(null);
         coyoteTimeFrames.current += 1;
         
         if (coyoteTimeFrames.current > 30) {
             latestHoveredId.current = null;
         }
      }

      // Pinch Edge Trigger (Phát hiện Cú Click Pinch Đầu Tiên)
      const isInitialPinch = isPinching && !wasPinching.current;

      if (isInitialPinch) {
         if (latestHoveredId.current !== null) {
             setActiveId(latestHoveredId.current); // Hiện vĩnh viễn Tooltip môn học
             setDraggedId(latestHoveredId.current); // Cho phép kéo di dời
         } else {
             setActiveId(null); // Bóp không trúng gì cả -> Thu hồi Tooltip tắt đi (Click Outside)
         }
      }

      // Xử lý giữ (Hold) để kéo trôi đi
      if (isPinching && draggedId) {
         setGlobalHoveredId(draggedId); // Khóa sáng mạnh vào đối tượng đang gắp
         
         let draggedNode: THREE.Object3D | null = null;
         scene.traverse((node: any) => {
             if (node.userData?.isRootStarGroup && node.userData.id === draggedId) {
                 draggedNode = node;
             }
         });

         if (draggedNode) {
             const targetPos = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(6));
             (draggedNode as THREE.Object3D).position.lerp(targetPos, 0.15);
         }
      }
    }

    // Luôn luôn thả gắp nếu mất tín hiệu bàn tay (isPinching = false hoặc mất dấu)
    if (!isPinching && draggedId) {
        setDraggedId(null);
    }

    wasPinching.current = isPinching;
  });

  return null;
}

function GalaxySystem({ isFullscreen, coords, isPinching, handGestures, milestones = [] }: any) {
  const [globalHoveredId, setGlobalHoveredId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null); 
  const [activeId, setActiveId] = useState<number | null>(null); // Lifted Click State
  const controlsRef = useRef<any>(null);

  const starPositions = useMemo(() => {
    return milestones.map((_: any, i: number) => {
      const angle = (i / milestones.length) * Math.PI * 2 + (i % 2 === 0 ? 0.5 : 0);
      const radius = 4 + (i % 3) * 2;
      const y = (i % 2 === 0 ? 1 : -1) * 2;
      return [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number];
    });
  }, [milestones]);

  return (
    <group>
      {/* Background Core */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial color="#fcd34d" emissive="#fbbf24" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <Html position={[0, -2.2, 0]} center zIndexRange={[0, 0]}>
        <div className="text-amber-300 font-bold tracking-widest text-xs uppercase pointer-events-none whitespace-nowrap drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] px-4 py-1 bg-black/50 rounded-full border border-amber-500/20">
          CỐT LÕI KIẾN THỨC
        </div>
      </Html>

      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={3} color="#fef3c7" distance={25} />

      <Stars radius={100} depth={50} count={isFullscreen ? 5000 : 2000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={isFullscreen ? 400 : 150} scale={20} size={isPinching ? 6 : 3} speed={0.4} color="#a78bfa" />

      {milestones.map((milestone: any, idx: number) => (
        <MilestoneStar 
          key={milestone.id} 
          data={milestone} 
          initialPosition={starPositions[idx]} 
          globalHoveredId={globalHoveredId}
          draggedId={draggedId}
          activeId={activeId}
        />
      ))}

      {isFullscreen && coords && (
        <AIHandController 
           coords={coords} 
           isPinching={isPinching} 
           handGestures={handGestures} 
           setGlobalHoveredId={setGlobalHoveredId} 
           draggedId={draggedId}
           setDraggedId={setDraggedId}
           activeId={activeId}
           setActiveId={setActiveId}
           controlsRef={controlsRef} 
        />
      )}

      <OrbitControls 
        ref={controlsRef}
        enablePan={false} 
        enableZoom={false} // Prevent mouse from overriding our hand spread zoom
        autoRotate={false} // Tuyệt đối không tự động xoay
      />
    </group>
  );
}

export default function LearningGalaxy({ isFullscreen = false }: { isFullscreen?: boolean }) {
  // Chỉ kích hoạt Tracking khi ở chế độ Fullscreen!
  const { coords, isPinching, handGestures, isReady, videoRef } = useHandTracking();

  const [milestones, setMilestones] = useState<any[]>([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem("minda_token");
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/assignments/student/my-submissions`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((sub: any, i: number) => ({
            id: sub.id,
            type: "assignment",
            title: sub.assignment_title,
            date: new Date(sub.submitted_at).toLocaleDateString("vi-VN"),
            color: ["#4ade80", "#60a5fa", "#fde047", "#f472b6", "#c084fc"][i % 5]
          }));
          setMilestones(mapped);
        }
      } catch (e) {}
    };
    fetchSubmissions();
  }, []);

  return (
    <section 
      className={`relative overflow-hidden group ${
        isFullscreen 
          ? "w-full h-full bg-bg-main" 
          : "w-full h-[400px] rounded-3xl border border-white/10 shrink-0 shadow-lg"
      }`}
    >
      
      {/* Lớp phủ Text HUD */}
      {!isFullscreen && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <h2 className="text-xl font-black text-white drop-shadow-lg tracking-tight">Hành Trang Tri Thức</h2>
          <p className="text-xs text-gray-300 drop-shadow-md">Túi Cặp Sách 3D</p>
        </div>
      )}

      {/* Chú giải */}
      <div className={`absolute z-10 pointer-events-none flex gap-4 ${isFullscreen ? 'bottom-8 left-8' : 'bottom-4 left-4 flex-col gap-2'}`}>
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,1)]"></div>
          <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Video đã xem</span>
        </div>
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)]"></div>
          <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Bài tập hoàn thành</span>
        </div>
        {isFullscreen && (
          <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 backdrop-blur-md ml-4 text-amber-300">
             🌟 Lời khuyên: Hãy GIƠ BÀN TAY lên Camera, chạm ngón cái và ngón trỏ để KÉO các vì sao!
          </div>
        )}
      </div>

      {/* Fullscreen AR Webcam Background - LUÔN MOUNT ĐỂ TRÁNH videoRef null LÚC INIT */}
      {isFullscreen && (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             muted 
             className={`w-full h-full object-cover transform -scale-x-100 blur-sm pointer-events-none transition-opacity duration-1000 ${isReady ? 'opacity-40' : 'opacity-0'}`} 
           />
        </div>
      )}

      {/* Thông báo khởi động TFJS */}
      {isFullscreen && !isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-indigo-400 bg-black/80 backdrop-blur-md z-[200]">
           <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           <span className="text-sm font-bold tracking-widest uppercase text-center px-4">Đang đồng bộ AI... (Vui lòng cấp quyền Camera nếu được hỏi)</span>
        </div>
      )}

      {/* AI Virtual Cursor Renderer */}
      {isFullscreen && isReady && coords && coords.x !== 0 && (
        <div 
          className="absolute top-0 left-0 w-screen h-screen pointer-events-none z-[120] overflow-hidden"
        >
          <div 
            className="absolute rounded-full border-2 border-white pointer-events-none transition-all duration-75 ease-out flex items-center justify-center backdrop-blur-sm"
            style={{ 
              transform: `translate(${coords.x - 25}px, ${coords.y - 25}px)`,
              width: isPinching ? '40px' : '50px',
              height: isPinching ? '40px' : '50px',
              backgroundColor: isPinching ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
              boxShadow: isPinching ? '0 0 25px rgba(99,102,241,0.8)' : '0 0 15px rgba(255,255,255,0.3)',
            }}
          >
            <div className={`w-2 h-2 bg-white rounded-full transition-transform ${isPinching ? 'scale-150' : 'scale-50'}`} />
          </div>
        </div>
      )}

      {/* 3D Scene */}
      <div className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-10 ${isFullscreen ? 'opacity-100' : ''}`}>
        <Canvas camera={{ position: [0, 5, 12], fov: 45 }} gl={{ alpha: true }}>
          {!isFullscreen && <color attach="background" args={["#050505"]} />}
          <GalaxySystem isFullscreen={isFullscreen} coords={isFullscreen && isReady ? coords : null} isPinching={isPinching} handGestures={handGestures} milestones={milestones} />
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
          </EffectComposer>
        </Canvas>
      </div>
    </section>
  );
}
