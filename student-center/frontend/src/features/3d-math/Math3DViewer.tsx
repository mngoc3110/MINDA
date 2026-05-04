"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, ContactShadows, Text, Line } from "@react-three/drei";
import { useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Loader2 } from "lucide-react";

export type ShapeType = "cube" | "sphere" | "cone" | "torus" | "cylinder" | "triangle" | "square" | "circle" | "pyramid" | "tetrahedron";

// ─── Shape Name Mapping ───
const SHAPE_NAMES: Record<ShapeType, string> = {
  cube: "Hình Lập Phương", sphere: "Hình Cầu", cone: "Hình Nón",
  torus: "Hình Xuyến", cylinder: "Hình Trụ", triangle: "Tam Giác",
  square: "Hình Vuông", circle: "Đường Tròn", pyramid: "Hình Chóp Tứ Giác",
  tetrahedron: "Tứ Diện",
};

// ─── Labeled Vertex ───
function VertexLabel({ position, label, color = "#e11d48" }: { position: [number, number, number]; label: string; color?: string }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text position={[0, 0.25, 0]} fontSize={0.28} color={color} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#ffffff">
        {label}
      </Text>
    </group>
  );
}

// ─── Dashed Line helper ───
function DashedEdge({ start, end, color = "#94a3b8" }: { start: [number, number, number]; end: [number, number, number]; color?: string }) {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  return <Line points={points} color={color} lineWidth={1} dashed dashSize={0.12} gapSize={0.08} />;
}

// ─── Solid Edge helper ───
function SolidEdge({ start, end, color = "#334155", width = 2 }: { start: [number, number, number]; end: [number, number, number]; color?: string; width?: number }) {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  return <Line points={points} color={color} lineWidth={width} />;
}

// ═══════════════════════════════════════════════
// PYRAMID S.ABCD – Textbook Style
// ═══════════════════════════════════════════════
function PyramidShape() {
  const S: [number, number, number] = [0, 2.5, 0];
  const A: [number, number, number] = [-1.2, 0, 1.2];
  const B: [number, number, number] = [1.2, 0, 1.2];
  const C: [number, number, number] = [1.2, 0, -1.2];
  const D: [number, number, number] = [-1.2, 0, -1.2];

  return (
    <group>
      {/* Transparent faces */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([
            ...S, ...A, ...B, ...S, ...B, ...C, ...S, ...C, ...D, ...S, ...D, ...A,
          ]), 3]} />
        </bufferGeometry>
        <meshBasicMaterial color="#6366f1" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Base face */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Visible edges (front) */}
      <SolidEdge start={S} end={A} color="#4338ca" />
      <SolidEdge start={S} end={B} color="#4338ca" />
      <SolidEdge start={S} end={C} color="#4338ca" />
      <SolidEdge start={S} end={D} color="#4338ca" />
      <SolidEdge start={A} end={B} color="#4338ca" />
      <SolidEdge start={B} end={C} color="#4338ca" />
      <SolidEdge start={C} end={D} color="#4338ca" />
      <SolidEdge start={D} end={A} color="#4338ca" />

      {/* Diagonals of base (dashed) */}
      <DashedEdge start={A} end={C} color="#f59e0b" />
      <DashedEdge start={B} end={D} color="#f59e0b" />

      {/* Height line from S to center O (dashed) */}
      <DashedEdge start={S} end={[0, 0, 0]} color="#ef4444" />
      <VertexLabel position={[0, -0.25, 0]} label="O" color="#ef4444" />

      {/* Vertex labels */}
      <VertexLabel position={S} label="S" />
      <VertexLabel position={A} label="A" />
      <VertexLabel position={B} label="B" />
      <VertexLabel position={C} label="C" />
      <VertexLabel position={D} label="D" />
    </group>
  );
}

// ═══════════════════════════════════════════════
// TETRAHEDRON S.ABC – Textbook Style
// ═══════════════════════════════════════════════
function TetrahedronShape() {
  const S: [number, number, number] = [0, 2.5, 0];
  const A: [number, number, number] = [-1.4, 0, 0.8];
  const B: [number, number, number] = [1.4, 0, 0.8];
  const C: [number, number, number] = [0, 0, -1.4];

  return (
    <group>
      <mesh>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([
            ...S, ...A, ...B, ...S, ...B, ...C, ...S, ...C, ...A, ...A, ...B, ...C,
          ]), 3]} />
        </bufferGeometry>
        <meshBasicMaterial color="#6366f1" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <SolidEdge start={S} end={A} color="#4338ca" />
      <SolidEdge start={S} end={B} color="#4338ca" />
      <SolidEdge start={S} end={C} color="#4338ca" />
      <SolidEdge start={A} end={B} color="#4338ca" />
      <SolidEdge start={B} end={C} color="#4338ca" />
      <SolidEdge start={C} end={A} color="#4338ca" />

      {/* Height */}
      <DashedEdge start={S} end={[0, 0, 0.07]} color="#ef4444" />
      <VertexLabel position={[0, -0.25, 0.07]} label="H" color="#ef4444" />

      <VertexLabel position={S} label="S" />
      <VertexLabel position={A} label="A" />
      <VertexLabel position={B} label="B" />
      <VertexLabel position={C} label="C" />
    </group>
  );
}

// ═══════════════════════════════════════════════
// CUBE – Textbook Style
// ═══════════════════════════════════════════════
function CubeShape() {
  const s = 1.2;
  const A: [number, number, number] = [-s, 0, s];
  const B: [number, number, number] = [s, 0, s];
  const C: [number, number, number] = [s, 0, -s];
  const D: [number, number, number] = [-s, 0, -s];
  const A1: [number, number, number] = [-s, 2*s, s];
  const B1: [number, number, number] = [s, 2*s, s];
  const C1: [number, number, number] = [s, 2*s, -s];
  const D1: [number, number, number] = [-s, 2*s, -s];

  return (
    <group>
      <mesh>
        <boxGeometry args={[2*s, 2*s, 2*s]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Bottom */}
      <SolidEdge start={A} end={B} /> <SolidEdge start={B} end={C} />
      <DashedEdge start={C} end={D} /> <DashedEdge start={D} end={A} />
      {/* Top */}
      <SolidEdge start={A1} end={B1} /> <SolidEdge start={B1} end={C1} />
      <SolidEdge start={C1} end={D1} /> <SolidEdge start={D1} end={A1} />
      {/* Verticals */}
      <SolidEdge start={A} end={A1} /> <SolidEdge start={B} end={B1} />
      <SolidEdge start={C} end={C1} /> <DashedEdge start={D} end={D1} />
      {/* Diagonal */}
      <DashedEdge start={A} end={C} color="#f59e0b" />

      <VertexLabel position={A} label="A" /> <VertexLabel position={B} label="B" />
      <VertexLabel position={C} label="C" /> <VertexLabel position={D} label="D" />
      <VertexLabel position={A1} label="A'" /> <VertexLabel position={B1} label="B'" />
      <VertexLabel position={C1} label="C'" /> <VertexLabel position={D1} label="D'" />
    </group>
  );
}

// ═══════════════════════════════════════════════
// CONE – Textbook Style
// ═══════════════════════════════════════════════
function ConeShape() {
  const segments = 48;
  const r = 1.4, h = 3;
  const S: [number, number, number] = [0, h, 0];
  const O: [number, number, number] = [0, 0, 0];

  const circlePoints: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    circlePoints.push([r * Math.cos(angle), 0, r * Math.sin(angle)]);
  }

  return (
    <group>
      <mesh>
        <coneGeometry args={[r, h, 32]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Base circle */}
      <Line points={circlePoints.map(p => new THREE.Vector3(...p))} color="#4338ca" lineWidth={2} />
      {/* Two slant lines */}
      <SolidEdge start={S} end={[r, 0, 0]} color="#4338ca" />
      <SolidEdge start={S} end={[-r, 0, 0]} color="#4338ca" />
      {/* Height */}
      <DashedEdge start={S} end={O} color="#ef4444" />
      {/* Radius */}
      <DashedEdge start={O} end={[r, 0, 0]} color="#f59e0b" />

      <VertexLabel position={S} label="S" />
      <VertexLabel position={O} label="O" color="#ef4444" />
      <VertexLabel position={[r + 0.15, -0.1, 0]} label="r" color="#f59e0b" />
    </group>
  );
}

// ═══════════════════════════════════════════════
// CYLINDER – Textbook Style
// ═══════════════════════════════════════════════
function CylinderShape() {
  const segments = 48;
  const r = 1.2, h = 2.8;

  const topCircle: [number, number, number][] = [];
  const bottomCircle: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    topCircle.push([r * Math.cos(angle), h, r * Math.sin(angle)]);
    bottomCircle.push([r * Math.cos(angle), 0, r * Math.sin(angle)]);
  }

  return (
    <group>
      <mesh>
        <cylinderGeometry args={[r, r, h, 32]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <Line points={topCircle.map(p => new THREE.Vector3(...p))} color="#4338ca" lineWidth={2} />
      <Line points={bottomCircle.map(p => new THREE.Vector3(...p))} color="#4338ca" lineWidth={2} />
      <SolidEdge start={[r, 0, 0]} end={[r, h, 0]} color="#4338ca" />
      <SolidEdge start={[-r, 0, 0]} end={[-r, h, 0]} color="#4338ca" />
      <DashedEdge start={[0, 0, 0]} end={[0, h, 0]} color="#ef4444" />
      <DashedEdge start={[0, 0, 0]} end={[r, 0, 0]} color="#f59e0b" />

      <VertexLabel position={[0, h + 0.15, 0]} label="O'" color="#ef4444" />
      <VertexLabel position={[0, -0.25, 0]} label="O" color="#ef4444" />
    </group>
  );
}

// ═══════════════════════════════════════════════
// SPHERE – Textbook Style
// ═══════════════════════════════════════════════
function SphereShape() {
  const r = 1.5;
  const segments = 48;

  const equator: [number, number, number][] = [];
  const meridian: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    equator.push([r * Math.cos(a), 0, r * Math.sin(a)]);
    meridian.push([0, r * Math.sin(a), r * Math.cos(a)]);
  }

  return (
    <group>
      <mesh>
        <sphereGeometry args={[r, 32, 32]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Line points={equator.map(p => new THREE.Vector3(...p))} color="#4338ca" lineWidth={1.5} />
      <Line points={meridian.map(p => new THREE.Vector3(...p))} color="#4338ca" lineWidth={1.5} />
      <DashedEdge start={[0, 0, 0]} end={[r, 0, 0]} color="#f59e0b" />
      <VertexLabel position={[0, -0.2, 0]} label="O" color="#ef4444" />
      <VertexLabel position={[r + 0.15, 0, 0]} label="R" color="#f59e0b" />
    </group>
  );
}

// ═══════════════════════════════════════════════
// 2D shapes — Triangle, Square, Circle
// ═══════════════════════════════════════════════
function TriangleShape() {
  const A: [number, number, number] = [-1.5, 0, 0];
  const B: [number, number, number] = [1.5, 0, 0];
  const C: [number, number, number] = [0, 2.6, 0];

  return (
    <group>
      <mesh>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([...A, ...B, ...C]), 3]} />
        </bufferGeometry>
        <meshBasicMaterial color="#6366f1" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <SolidEdge start={A} end={B} color="#4338ca" />
      <SolidEdge start={B} end={C} color="#4338ca" />
      <SolidEdge start={C} end={A} color="#4338ca" />
      {/* Height */}
      <DashedEdge start={C} end={[0, 0, 0]} color="#ef4444" />
      <VertexLabel position={A} label="A" />
      <VertexLabel position={B} label="B" />
      <VertexLabel position={C} label="C" />
      <VertexLabel position={[0, -0.25, 0]} label="H" color="#ef4444" />
    </group>
  );
}

function SquareShape() {
  const A: [number, number, number] = [-1.3, 0, 0];
  const B: [number, number, number] = [1.3, 0, 0];
  const C: [number, number, number] = [1.3, 2.6, 0];
  const D: [number, number, number] = [-1.3, 2.6, 0];

  return (
    <group>
      <mesh>
        <planeGeometry args={[2.6, 2.6]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <SolidEdge start={A} end={B} color="#4338ca" />
      <SolidEdge start={B} end={C} color="#4338ca" />
      <SolidEdge start={C} end={D} color="#4338ca" />
      <SolidEdge start={D} end={A} color="#4338ca" />
      <DashedEdge start={A} end={C} color="#f59e0b" />
      <DashedEdge start={B} end={D} color="#f59e0b" />
      <VertexLabel position={A} label="A" />
      <VertexLabel position={B} label="B" />
      <VertexLabel position={C} label="C" />
      <VertexLabel position={D} label="D" />
    </group>
  );
}

function CircleShape() {
  const r = 1.5, segments = 64;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push([r * Math.cos(a), r * Math.sin(a), 0]);
  }
  return (
    <group>
      <mesh>
        <circleGeometry args={[r, 64]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Line points={pts.map(p => new THREE.Vector3(...p))} color="#4338ca" lineWidth={2} />
      <DashedEdge start={[0, 0, 0]} end={[r, 0, 0]} color="#f59e0b" />
      <VertexLabel position={[0, -0.25, 0]} label="O" color="#ef4444" />
      <VertexLabel position={[r + 0.15, 0, 0]} label="R" color="#f59e0b" />
    </group>
  );
}

// ═══════════════════════════════════════════════
// VERTEX POSITION MAPS (for computing extra points)
// ═══════════════════════════════════════════════
const VERTEX_MAPS: Partial<Record<ShapeType, Record<string, [number, number, number]>>> = {
  pyramid: {
    S: [0, 2.5, 0], A: [-1.2, 0, 1.2], B: [1.2, 0, 1.2],
    C: [1.2, 0, -1.2], D: [-1.2, 0, -1.2], O: [0, 0, 0],
  },
  tetrahedron: {
    S: [0, 2.5, 0], A: [-1.4, 0, 0.8], B: [1.4, 0, 0.8], C: [0, 0, -1.4],
  },
  cube: {
    A: [-1.2, 0, 1.2], B: [1.2, 0, 1.2], C: [1.2, 0, -1.2], D: [-1.2, 0, -1.2],
    A1: [-1.2, 2.4, 1.2], B1: [1.2, 2.4, 1.2], C1: [1.2, 2.4, -1.2], D1: [-1.2, 2.4, -1.2],
  },
  triangle: { A: [-1.5, 0, 0], B: [1.5, 0, 0], C: [0, 2.6, 0] },
  square: { A: [-1.3, 0, 0], B: [1.3, 0, 0], C: [1.3, 2.6, 0], D: [-1.3, 2.6, 0] },
};

function midpoint(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [(a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2];
}

interface ExtraGeometry {
  points: Record<string, string>;
  lines: { from: string; to: string; style: "solid" | "dashed"; color?: string }[];
}

const COLOR_MAP: Record<string, string> = {
  red: "#ef4444", blue: "#3b82f6", green: "#22c55e", orange: "#f97316",
};

function ExtraGeometryOverlay({ shape, geo }: { shape: ShapeType; geo: ExtraGeometry }) {
  const baseVertices = VERTEX_MAPS[shape] || {};

  // Resolve all points (base + extra)
  const allVertices: Record<string, [number, number, number]> = { ...baseVertices };
  
  if (geo.points) {
    for (const [name, def] of Object.entries(geo.points)) {
      const midMatch = def.match(/^mid\((\w+),(\w+)\)$/);
      if (midMatch) {
        const p1 = allVertices[midMatch[1]];
        const p2 = allVertices[midMatch[2]];
        if (p1 && p2) allVertices[name] = midpoint(p1, p2);
      }
    }
  }

  return (
    <group>
      {/* Render extra points */}
      {geo.points && Object.keys(geo.points).map((name) => {
        const pos = allVertices[name];
        if (!pos) return null;
        return <VertexLabel key={name} position={pos} label={name} color="#f97316" />;
      })}

      {/* Render extra lines */}
      {geo.lines && geo.lines.map((line, i) => {
        const from = allVertices[line.from];
        const to = allVertices[line.to];
        if (!from || !to) return null;
        const color = COLOR_MAP[line.color || "orange"] || "#f97316";
        if (line.style === "dashed") {
          return <DashedEdge key={i} start={from} end={to} color={color} />;
        }
        return <SolidEdge key={i} start={from} end={to} color={color} width={2.5} />;
      })}
    </group>
  );
}

// ═══════════════════════════════════════════════
// MAIN VIEWER
// ═══════════════════════════════════════════════
export default function Math3DViewer({ shape = "cone", extraGeometry }: { shape?: ShapeType; extraGeometry?: ExtraGeometry | null }) {
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 relative overflow-hidden">
      <div className="flex-1 w-full relative bg-radial from-slate-50 to-slate-200">

        {/* Shape name badge */}
        <div className="absolute top-4 left-4 z-10 text-xs font-semibold text-indigo-700 bg-indigo-100/80 px-3 py-1.5 rounded-full border border-indigo-200 backdrop-blur-md shadow-sm">
           🖱️ Xoay | 🔍 Phóng | ➡️ Di chuyển
        </div>
        <div className="absolute top-4 right-4 z-10 text-xs font-bold text-white bg-indigo-600/90 px-3 py-1.5 rounded-full border border-indigo-400 backdrop-blur-md shadow-sm">
           Đang Vẽ: {SHAPE_NAMES[shape] || shape}
        </div>

        <Canvas camera={{ position: [4, 3, 5], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          <group key={shape}>
            {shape === "pyramid" && <PyramidShape />}
            {shape === "tetrahedron" && <TetrahedronShape />}
            {shape === "cube" && <CubeShape />}
            {shape === "cone" && <ConeShape />}
            {shape === "cylinder" && <CylinderShape />}
            {shape === "sphere" && <SphereShape />}
            {shape === "triangle" && <TriangleShape />}
            {shape === "square" && <SquareShape />}
            {shape === "circle" && <CircleShape />}

            {/* Extra points & lines from AI solution */}
            {extraGeometry && <ExtraGeometryOverlay shape={shape} geo={extraGeometry} />}
          </group>

          <Grid
            position={[0, -0.01, 0]}
            args={[10.5, 10.5]}
            cellSize={0.5} cellThickness={0.5} cellColor="#cbd5e1"
            sectionSize={2.5} sectionThickness={1.5} sectionColor="#a5b4fc"
            fadeDistance={25} fadeStrength={1}
          />
          <primitive object={new THREE.AxesHelper(3)} position={[-2, 0, -2]} />
          <ContactShadows position={[0, -0.01, 0]} opacity={0.3} scale={10} blur={2.5} far={4} />
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} enableDamping dampingFactor={0.05} />
        </Canvas>
      </div>
    </div>
  );
}
