"use client";

import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Html } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint, RigidBodyProps } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

extend({ MeshLineGeometry, MeshLineMaterial })

export function InteractiveBadge({ userName }: { userName: string }) {
  return (
    <div className="w-full h-full min-h-[500px]">
      <Canvas 
          camera={{ position: [0, 0, 13], fov: 25 }} 
          style={{ pointerEvents: 'none' }} 
          eventSource={typeof window !== 'undefined' ? document.body : undefined}
      >
        <ambientLight intensity={Math.PI} />
        <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
          <Band userName={userName} />
        </Physics>
        <Environment background={false} blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  )
}

function Band({ userName }: { userName: string }) {
  const band = useRef<any>(null)
  const fixed = useRef<any>(null)
  const j1 = useRef<any>(null)
  const card = useRef<any>(null)

  const vec = new THREE.Vector3()
  const ang = new THREE.Vector3()
  const rot = new THREE.Vector3()
  const dir = new THREE.Vector3()
  
  const [dragged, drag] = useState<THREE.Vector3 | false>(false)
  const [hovered, hover] = useState(false)

  const { size, viewport, camera } = useThree()
  const { width, height } = size
  const [curve] = useState(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
  ]))

  const defaultProps: RigidBodyProps = {
    angularDamping: 2,
    linearDamping: 2,
    friction: 0.1,
  };

  // Fixed anchor dynamically at Top Right of the viewport
  const anchorPosition: [number, number, number] = [viewport.width / 2 - 2, viewport.height / 2 + 0.5, -1];

  // Only 1 joint to make the string shorter
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1.5])
  useSphericalJoint(j1, card, [[0, 0, 0], [0, 1.45, 0]])

  useEffect(() => {
    if (hovered) document.body.style.cursor = dragged ? 'grabbing' : 'grab'
    else document.body.style.cursor = 'auto'
  }, [hovered, dragged])

  useFrame((state) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }
    
    if (fixed.current && j1.current && card.current && band.current) {
        const p1 = fixed.current.translation();
        const p2 = j1.current.translation();
        const p3 = card.current.translation();
        const mid = new THREE.Vector3().copy(p2).lerp(p3, 0.5);
        curve.points[0].copy(p3)
        curve.points[1].copy(mid)
        curve.points[2].copy(p2)
        curve.points[3].copy(p1)
        band.current.geometry.setPoints(curve.getPoints(32))
    }

    if (card.current) {
        ang.copy(card.current.angvel())
        rot.copy(card.current.rotation())
        card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
    }
  })

  return (
    <>
      <RigidBody ref={fixed} type="fixed" position={anchorPosition} />
      <RigidBody position={[anchorPosition[0], anchorPosition[1] - 0.5, anchorPosition[2]]} ref={j1} {...defaultProps}>
        <BallCollider args={[0.1]} />
      </RigidBody>
      
      <mesh ref={band}>
        {/* @ts-expect-error */}
        <meshLineGeometry />
        {/* @ts-expect-error */}
        <meshLineMaterial color="white" resolution={[width, height]} lineWidth={2} />
      </mesh>
      
      <RigidBody 
         position={[anchorPosition[0], anchorPosition[1] - 2, anchorPosition[2]]} 
         ref={card} 
         {...defaultProps} 
         type={dragged ? 'kinematicPosition' : 'dynamic'}
      >
        <CuboidCollider args={[0.8, 1.125, 0.05]} />
        <group>
          {/* Card Body - Made visible to ensure something is there */}
          <mesh>
             <boxGeometry args={[1.6, 2.25, 0.02]} />
             <meshStandardMaterial color="#2E0A4E" roughness={0.2} metalness={0.5} />
          </mesh>

          {/* Front of Card with HTML */}
          <mesh position={[0, 0, 0.015]}>
             <planeGeometry args={[1.6, 2.25]} />
             <meshBasicMaterial color="#ffffff" transparent opacity={0} />
             <Html transform zIndexRange={[100, 0]} position={[0, 0, 0.01]} distanceFactor={1.5} center>
                <div 
                   onPointerOver={() => hover(true)}
                   onPointerOut={() => hover(false)}
                   onPointerUp={(e) => {
                     (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                     drag(false);
                   }}
                   onPointerDown={(e) => {
                       (e.target as HTMLElement).setPointerCapture(e.pointerId);
                       if (card.current) {
                           // calc 3d intersection from dom event
                           const x = (e.clientX / window.innerWidth) * 2 - 1;
                           const y = -(e.clientY / window.innerHeight) * 2 + 1;
                           vec.set(x, y, 0.5).unproject(camera);
                           dir.copy(vec).sub(camera.position).normalize();
                           vec.add(dir.multiplyScalar(camera.position.length()));
                           drag(new THREE.Vector3().copy(vec).sub(card.current.translation()));
                       }
                   }}
                   className="w-[180px] h-[253px] flex flex-col justify-between p-3 rounded-xl bg-gradient-to-br from-indigo-500/80 to-purple-500/50 backdrop-blur-md border border-white/20 select-none shadow-2xl pointer-events-auto cursor-grab active:cursor-grabbing"
                >
                  <div className="flex flex-col items-center justify-center pt-2 pointer-events-none">
                    <div className="w-16 h-16 rounded-full border-2 border-white/50 bg-bg-hover overflow-hidden flex items-center justify-center shadow-inner relative z-10 mx-auto mt-2">
                      <span className="text-3xl font-bold text-white">{userName ? userName.charAt(0).toUpperCase() : 'M'}</span>
                    </div>
                    <h3 className="font-black text-sm tracking-tight text-white m-0 leading-none text-center truncate w-full mt-3">{userName}</h3>
                    <p className="text-[10px] text-indigo-200 mt-1 uppercase font-bold tracking-wider">#MND-8429</p>
                  </div>
                  
                  <div className="flex flex-col gap-1 w-full relative z-10 pointer-events-auto">
                    <button 
                      onClick={() => alert('Thẻ đang hoạt động!')}
                      className="w-full text-[10px] py-1.5 bg-[#0a0a0a]/50 hover:bg-[#0a0a0a]/80 text-white rounded-md font-bold transition-all border border-white/10">
                      Đang hoạt động
                    </button>
                  </div>
                </div>
             </Html>
          </mesh>
        </group>
      </RigidBody>
    </>
  )
}
