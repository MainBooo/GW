"use client"

import { useRef } from "react"
import * as THREE from "three"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { sceneState } from "@/lib/scene-store"
import { PIPELINE_NODE_POSITIONS } from "@/components/core/shapes"

const STAGES = [
  { title: "Campaign", text: "Оператор задаёт цель поиска и ограничения" },
  { title: "Planner", text: "Строит план источников и поисковых запросов" },
  { title: "Lead Hunter", text: "Обходит источники и собирает компании" },
  { title: "Research Agent", text: "Исследует сайт и специализацию компании" },
  { title: "Scoring Agent", text: "Оценивает соответствие предложению" },
  { title: "Contact Enrichment", text: "Находит контакты для первого обращения" },
]

function pipelineIndex(name: string): number | null {
  if (!name.startsWith("pipeline-")) return null
  return Number(name.split("-")[1])
}

export function PipelineLabels() {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const groupOpacity = useRef(0)

  useFrame(() => {
    const ia = pipelineIndex(sceneState.checkpointA)
    const ib = pipelineIndex(sceneState.checkpointB)

    let targetOpacity = 0
    let reveal = 0

    if (ia !== null && ib !== null) {
      targetOpacity = 1
      reveal = THREE.MathUtils.lerp(ia, ib, sceneState.progress)
    } else if (ia !== null && ib === null) {
      targetOpacity = 1 - sceneState.progress
      reveal = ia
    } else if (ia === null && ib !== null) {
      targetOpacity = sceneState.progress
      reveal = ib
    }

    groupOpacity.current = THREE.MathUtils.lerp(groupOpacity.current, targetOpacity, 0.15)

    refs.current.forEach((el, i) => {
      if (!el) return
      const activeness = THREE.MathUtils.clamp(1 - Math.abs(reveal - (i + 1)), 0, 1)
      const opacity = activeness * groupOpacity.current
      el.style.opacity = String(opacity)
      el.style.transform = `translateY(${(1 - activeness) * 10}px)`
    })
  })

  return (
    <>
      {PIPELINE_NODE_POSITIONS.map((pos, i) => (
        <Html key={i} position={[pos.x, pos.y + 1.2, pos.z]} center distanceFactor={9} zIndexRange={[20, 0]} occlude={false}>
          <div
            ref={(el) => {
              refs.current[i] = el
            }}
            className="pointer-events-none w-60 -translate-y-2 rounded-2xl border border-white/10 bg-background/75 px-4 py-3 text-center backdrop-blur-md opacity-0 transition-opacity duration-200"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary/85">
              {String(i + 1).padStart(2, "0")} — {STAGES[i].title}
            </div>
            <div className="mt-1 text-[11px] leading-4 text-white/65">{STAGES[i].text}</div>
          </div>
        </Html>
      ))}
    </>
  )
}
