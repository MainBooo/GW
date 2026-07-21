"use client"

import { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { generateAllCheckpoints, CHECKPOINTS, createRand } from "@/components/core/shapes"
import { createParticleMaterial } from "@/components/core/particle-material"
import { sceneState, type CheckpointName } from "@/lib/scene-store"

export function ParticleField({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const lastA = useRef<CheckpointName | null>(null)
  const lastB = useRef<CheckpointName | null>(null)
  const clockRef = useRef(0)
  const { size } = useThree()

  const shapes = useMemo(() => generateAllCheckpoints(count), [count])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const rand = createRand(42)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) seeds[i] = rand()

    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    geo.setAttribute("aPosA", new THREE.BufferAttribute(new Float32Array(shapes[sceneState.checkpointA]), 3))
    geo.setAttribute("aPosB", new THREE.BufferAttribute(new Float32Array(shapes[sceneState.checkpointB]), 3))
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1))
    return geo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, shapes])

  const material = useMemo(() => {
    const mat = createParticleMaterial(new THREE.Color(...CHECKPOINTS.ring.color))
    materialRef.current = mat
    return mat
  }, [])

  const colorScratch = useMemo(() => new THREE.Color(), [])
  const colorA = useMemo(() => new THREE.Color(), [])
  const colorB = useMemo(() => new THREE.Color(), [])

  useFrame((_, delta) => {
    const mat = materialRef.current
    const geo = pointsRef.current?.geometry
    if (!mat || !geo) return

    if (!sceneState.paused) {
      clockRef.current += delta * sceneState.timeScale
    }

    if (sceneState.checkpointA !== lastA.current) {
      const attr = geo.getAttribute("aPosA") as THREE.BufferAttribute
      ;(attr.array as Float32Array).set(shapes[sceneState.checkpointA])
      attr.needsUpdate = true
      lastA.current = sceneState.checkpointA
    }
    if (sceneState.checkpointB !== lastB.current) {
      const attr = geo.getAttribute("aPosB") as THREE.BufferAttribute
      ;(attr.array as Float32Array).set(shapes[sceneState.checkpointB])
      attr.needsUpdate = true
      lastB.current = sceneState.checkpointB
    }

    mat.uniforms.uProgress.value = sceneState.progress
    mat.uniforms.uTime.value = clockRef.current
    mat.uniforms.uMouseInfluence.value = sceneState.mouseInfluence
    mat.uniforms.uPixelRatio.value = Math.min(2, window.devicePixelRatio || 1)

    colorA.set(...CHECKPOINTS[lastA.current ?? "ring"].color)
    colorB.set(...CHECKPOINTS[lastB.current ?? "ring"].color)
    colorScratch.copy(colorA).lerp(colorB, sceneState.progress)
    ;(mat.uniforms.uColor.value as THREE.Color).copy(colorScratch)
  })

  useFrame(() => {
    const mat = materialRef.current
    if (!mat) return
    const mouseUniform = mat.uniforms.uMouse.value as THREE.Vector2
    mouseUniform.set(sceneState.mouse.x * 3.4, sceneState.mouse.y * (2.2 * (size.height / size.width)))
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}
