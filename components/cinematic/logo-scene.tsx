"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

/**
 * Отдельная от lib/device-tier.ts проверка: там prefers-reduced-motion сразу
 * означает tier "static" (сцена вообще не рисуется — верно для частиц). Для
 * логотипа спецификация другая — при reduced-motion форма остаётся видна,
 * просто без вращения и реакции на курсор; на flat SVG откатываемся только
 * при реальном отсутствии WebGL.
 */
type LogoTier = "full" | "lite" | "off"

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")))
  } catch {
    return false
  }
}

function detectLogoTier(): LogoTier {
  if (!hasWebGL()) return "off"

  const isCoarse = window.matchMedia("(pointer: coarse)").matches
  const isNarrow = window.matchMedia("(max-width: 768px)").matches
  const nav = navigator as Navigator & { deviceMemory?: number }
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return "off"

  if (isCoarse || isNarrow || (navigator.hardwareConcurrency ?? 4) <= 2) return "lite"
  return "full"
}

/**
 * Узлы и рёбра повторяют существующий плоский знак GenerationWeb
 * (public/logo/generationweb.svg, viewBox 424×388) — координаты переведены
 * в 3D простым масштабом/центрированием, без придумывания новой формы.
 */
const SVG_SCALE = 1 / 150
const SVG_CENTER = { x: 212, y: 194 }

function fromSvg(x: number, y: number, z: number): [number, number, number] {
  return [(x - SVG_CENTER.x) * SVG_SCALE, -(y - SVG_CENTER.y) * SVG_SCALE, z]
}

type NodeId = "A" | "B" | "C" | "D" | "E" | "F"

const NODES: Record<NodeId, { pos: [number, number, number]; material: "ceramic" | "sand" | "bordeaux"; r: number }> = {
  A: { pos: fromSvg(20, 224, -0.15), material: "ceramic", r: 0.1 },
  B: { pos: fromSvg(117, 48, -0.15), material: "ceramic", r: 0.09 },
  C: { pos: fromSvg(117, 364, -0.15), material: "ceramic", r: 0.09 },
  D: { pos: fromSvg(200, 199, 0), material: "sand", r: 0.12 },
  E: { pos: fromSvg(293, 18, 0.15), material: "bordeaux", r: 0.1 },
  F: { pos: fromSvg(401, 198, 0.15), material: "bordeaux", r: 0.1 },
}

const EDGES: [NodeId, NodeId][] = [
  ["A", "B"],
  ["A", "D"],
  ["A", "C"],
  ["C", "D"],
  ["D", "E"],
  ["E", "F"],
  ["D", "F"],
]

const MATERIAL_PROPS: Record<"ceramic" | "sand" | "bordeaux", { color: string; roughness: number; clearcoat: number }> = {
  ceramic: { color: "#22232b", roughness: 0.82, clearcoat: 0.18 },
  sand: { color: "#c9ae82", roughness: 0.6, clearcoat: 0.22 },
  bordeaux: { color: "#6e2430", roughness: 0.5, clearcoat: 0.3 },
}

function Node({ id, segments }: { id: NodeId; segments: number }) {
  const { pos, material, r } = NODES[id]
  const props = MATERIAL_PROPS[material]
  return (
    <mesh position={pos}>
      <sphereGeometry args={[r, segments, segments]} />
      <meshPhysicalMaterial {...props} metalness={0} clearcoatRoughness={0.4} />
    </mesh>
  )
}

function Rod({ from, to, segments }: { from: NodeId; to: NodeId; segments: number }) {
  const { geometry, position, quaternion } = useMemo(() => {
    const a = new THREE.Vector3(...NODES[from].pos)
    const b = new THREE.Vector3(...NODES[to].pos)
    const direction = new THREE.Vector3().subVectors(b, a)
    const length = direction.length()
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
    return {
      geometry: new THREE.CylinderGeometry(0.028, 0.028, length, segments),
      position: mid,
      quaternion: quat,
    }
  }, [from, to, segments])

  const props = MATERIAL_PROPS.ceramic

  return (
    <mesh geometry={geometry} position={position} quaternion={quaternion}>
      <meshPhysicalMaterial {...props} metalness={0} clearcoatRoughness={0.4} />
    </mesh>
  )
}

function LogoRig({ spinning, segments }: { spinning: boolean; segments: number }) {
  const group = useRef<THREE.Group>(null)
  const { pointer, invalidate } = useThree()

  useEffect(() => {
    if (!spinning && group.current) {
      // Фиксированный, заранее выверенный ракурс вместо "заморозки на
      // случайном кадре" — важно для prefers-reduced-motion и tier "lite".
      // frameloop="demand" не перерисует канвас сам — просим кадр явно.
      group.current.rotation.set(0.1, -0.3, 0)
      invalidate()
    }
  }, [spinning, invalidate])

  useFrame((_, delta) => {
    if (!spinning || !group.current) return
    group.current.rotation.y += delta * 0.045
    const targetX = 0.1 - pointer.y * 0.12
    const targetZ = pointer.x * 0.08
    group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, delta * 2)
    group.current.rotation.z += (targetZ - group.current.rotation.z) * Math.min(1, delta * 2)
  })

  const rodSegments = Math.max(6, Math.round(segments / 2))
  return (
    <group ref={group} rotation={[0.1, -0.3, 0]}>
      {EDGES.map(([from, to]) => (
        <Rod key={`${from}-${to}`} from={from} to={to} segments={rodSegments} />
      ))}
      {(Object.keys(NODES) as NodeId[]).map((id) => (
        <Node key={id} id={id} segments={segments} />
      ))}
    </group>
  )
}

function FallbackLogo({ className }: { className?: string }) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Image src="/logo/generationweb.svg" alt="GenerationWeb" fill className="object-contain opacity-90" sizes="(min-width: 1024px) 480px, 60vw" />
    </div>
  )
}

export interface LogoSceneProps {
  /** Смонтировать canvas (готовим заранее, аналогично preload у видео). */
  mounted: boolean
  /** Активна ли анимация прямо сейчас (экран 1 в фокусе, вкладка видима). */
  spinning: boolean
  className?: string
}

/**
 * Лёгкая процедурная Three.js-сцена поверх видео экрана 1. Рендерится через
 * @react-three/fiber — тот же стек, что уже используется в кейсе ReputationOS
 * (components/cases/product-stage.tsx), Canvas сам освобождает renderer/
 * geometry/materials при размонтировании.
 */
export function LogoScene({ mounted, spinning, className }: LogoSceneProps) {
  const [tier, setTier] = useState<LogoTier | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setTier(detectLogoTier())
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // До определения возможностей и без WebGL — обычный SVG-логотип, без
  // сломанной композиции. При prefers-reduced-motion сцена остаётся (см.
  // spinning ниже), откат на SVG — только когда рисовать реально нечем.
  if (tier === null || tier === "off") {
    return <FallbackLogo className={className} />
  }

  if (!mounted) {
    return <FallbackLogo className={className} />
  }

  const reducedSegments = tier === "lite" ? 12 : 24
  const dprCap: [number, number] = tier === "lite" ? [1, 1.2] : [1, 1.5]
  const canSpin = spinning && !reducedMotion

  return (
    <div className={className}>
      <Canvas
        dpr={dprCap}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ fov: 40, position: [0, 0, 4.2] }}
        frameloop={canSpin ? "always" : "demand"}
      >
        <ambientLight intensity={0.28} color="#3a3f52" />
        <directionalLight position={[-2.2, 1.6, -1.8]} intensity={1.4} color="#cfd6ff" />
        <directionalLight position={[1.6, 2, 2.6]} intensity={0.55} color="#f2ecdd" />

        <Suspense fallback={null}>
          <LogoRig spinning={canSpin} segments={reducedSegments} />
        </Suspense>
      </Canvas>
    </div>
  )
}
