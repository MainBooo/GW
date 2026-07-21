"use client"

import { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { sceneState } from "@/lib/scene-store"
import { PIPELINE_NODE_POSITIONS } from "@/components/core/shapes"

function pipelineIndex(name: string): number | null {
  if (!name.startsWith("pipeline-")) return null
  return Number(name.split("-")[1])
}

const SEGMENT_COUNT = PIPELINE_NODE_POSITIONS.length - 1

export function Connections() {
  const groupRef = useRef<THREE.Group>(null)
  const pulseRefs = useRef<THREE.Mesh[]>([])
  const groupOpacity = useRef(0)

  const segments = useMemo(
    () =>
      Array.from({ length: SEGMENT_COUNT }, (_, i) => ({
        start: new THREE.Vector3(
          PIPELINE_NODE_POSITIONS[i].x,
          PIPELINE_NODE_POSITIONS[i].y,
          PIPELINE_NODE_POSITIONS[i].z,
        ),
        end: new THREE.Vector3(
          PIPELINE_NODE_POSITIONS[i + 1].x,
          PIPELINE_NODE_POSITIONS[i + 1].y,
          PIPELINE_NODE_POSITIONS[i + 1].z,
        ),
      })),
    [],
  )

  const lines = useMemo(
    () =>
      segments.map((seg) => {
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array([seg.start.x, seg.start.y, seg.start.z, seg.start.x, seg.start.y, seg.start.z]), 3),
        )
        const material = new THREE.LineBasicMaterial({ color: "#5ad1ff", transparent: true, opacity: 0 })
        return new THREE.Line(geometry, material)
      }),
    [segments],
  )

  useFrame((state) => {
    const a = sceneState.checkpointA
    const b = sceneState.checkpointB
    const ia = pipelineIndex(a)
    const ib = pipelineIndex(b)

    let targetOpacity = 0
    let revealCount = 0

    if (ia !== null && ib !== null) {
      targetOpacity = 1
      revealCount = THREE.MathUtils.lerp(ia, ib, sceneState.progress)
    } else if (ia !== null && ib === null) {
      targetOpacity = 1 - sceneState.progress
      revealCount = ia
    } else if (ia === null && ib !== null) {
      targetOpacity = sceneState.progress
      revealCount = ib
    }

    groupOpacity.current = THREE.MathUtils.lerp(groupOpacity.current, targetOpacity, 0.15)
    if (groupRef.current) groupRef.current.visible = groupOpacity.current > 0.005

    segments.forEach((seg, i) => {
      const segReveal = THREE.MathUtils.clamp(revealCount - (i + 1), 0, 1)
      const line = lines[i]
      const pulse = pulseRefs.current[i]
      if (!line || !pulse) return

      const posAttr = line.geometry.getAttribute("position") as THREE.BufferAttribute
      const endPoint = seg.start.clone().lerp(seg.end, segReveal)
      posAttr.setXYZ(1, endPoint.x, endPoint.y, endPoint.z)
      posAttr.needsUpdate = true

      const mat = line.material as THREE.LineBasicMaterial
      mat.opacity = segReveal * groupOpacity.current

      const pulseMat = pulse.material as THREE.MeshBasicMaterial
      if (segReveal > 0.98) {
        const t = (state.clock.elapsedTime * 0.5 + i * 0.18) % 1
        pulse.position.copy(seg.start).lerp(seg.end, t)
        pulseMat.opacity = groupOpacity.current * (0.4 + 0.6 * Math.sin(t * Math.PI))
      } else {
        pulseMat.opacity = 0
      }
    })
  })

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => (
        <primitive key={`line-${i}`} object={line} />
      ))}
      {segments.map((_, i) => (
        <mesh
          key={`pulse-${i}`}
          ref={(el) => {
            if (el) pulseRefs.current[i] = el
          }}
        >
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#eafcff" transparent opacity={0} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
