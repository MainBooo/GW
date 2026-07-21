"use client"

import { useMemo, useRef } from "react"
import * as THREE from "three"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { sceneState } from "@/lib/scene-store"
import { TECH_CATEGORIES } from "@/components/core/shapes"

function ecosystemBlend(): number {
  const a = sceneState.checkpointA === "ecosystem"
  const b = sceneState.checkpointB === "ecosystem"
  if (a && b) return 1
  if (a && !b) return 1 - sceneState.progress
  if (!a && b) return sceneState.progress
  return 0
}

export function TechMapNodes() {
  const groupOpacity = useRef(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const lines = useMemo(
    () =>
      TECH_CATEGORIES.map((cat) => {
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array([0, 0, 0, cat.pos.x, cat.pos.y, cat.pos.z]), 3),
        )
        const material = new THREE.LineBasicMaterial({ color: "#806bff", transparent: true, opacity: 0 })
        return new THREE.Line(geometry, material)
      }),
    [],
  )

  useFrame(() => {
    const target = ecosystemBlend()
    groupOpacity.current = THREE.MathUtils.lerp(groupOpacity.current, target, 0.15)
    const visible = groupOpacity.current > 0.01
    const hover = sceneState.techHoverIndex

    cardRefs.current.forEach((el, i) => {
      if (!el) return
      const dim = hover !== null && hover !== i ? 0.35 : 1
      const scale = hover === i ? 1.08 : 1
      el.style.opacity = String(visible ? groupOpacity.current * dim : 0)
      el.style.transform = `scale(${scale})`
    })

    lines.forEach((line, i) => {
      const mat = line.material as THREE.LineBasicMaterial
      const boost = hover === i ? 1 : hover !== null ? 0.25 : 0.55
      mat.opacity = groupOpacity.current * boost
    })
  })

  return (
    <group>
      {lines.map((line, i) => (
        <primitive key={`line-${TECH_CATEGORIES[i].key}`} object={line} />
      ))}

      {TECH_CATEGORIES.map((cat, i) => (
        <Html key={cat.key} position={[cat.pos.x, cat.pos.y, cat.pos.z]} center distanceFactor={9} zIndexRange={[20, 0]}>
          <div
            ref={(el) => {
              cardRefs.current[i] = el
            }}
            onMouseEnter={() => {
              sceneState.techHoverIndex = i
            }}
            onMouseLeave={() => {
              sceneState.techHoverIndex = null
            }}
            className="pointer-events-auto w-44 cursor-default rounded-2xl border border-white/10 bg-background/75 px-3.5 py-3 text-center backdrop-blur-md transition-transform duration-200"
            style={{ opacity: 0 }}
            data-cursor-el
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary/85">{cat.label}</div>
            <div className="mt-1.5 flex flex-wrap justify-center gap-1">
              {cat.items.map((item) => (
                <span key={item} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/55">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Html>
      ))}
    </group>
  )
}
