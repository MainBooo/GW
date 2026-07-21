"use client"

import { useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { CoreScene } from "@/components/core/core-scene"
import { MouseTracker } from "@/components/core/mouse-tracker"
import { FallbackCanvas2D } from "@/components/core/fallback-canvas2d"
import { detectDeviceTier, PARTICLE_COUNTS, type DeviceTier } from "@/lib/device-tier"
import { sceneState } from "@/lib/scene-store"
import { useActiveRegion } from "@/lib/use-active-region"

function VisibilityPause() {
  useEffect(() => {
    const onVisibility = () => {
      sceneState.paused = document.hidden
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])
  return null
}

export default function GenerationCoreCanvas({ onReady }: { onReady?: () => void }) {
  const [tier, setTier] = useState<DeviceTier | null>(null)

  useEffect(() => {
    const detected = detectDeviceTier()
    setTier(detected)
    sceneState.reduced = detected === "static"

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => {
      const next = detectDeviceTier()
      setTier(next)
      sceneState.reduced = next === "static"
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    if (tier === "static") onReady?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier])

  const activeRegion = useActiveRegion()

  if (tier === null) return null
  if (tier === "static") return <FallbackCanvas2D />

  const isCoarse = tier === "lite"

  return (
    <div className="fixed inset-0 z-0" data-generation-core-canvas="true">
      <Canvas
        dpr={[1, isCoarse ? 1.5 : 2]}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        camera={{ fov: 45, position: [0, 0, 9] }}
        frameloop="always"
        onCreated={({ gl }) => {
          gl.setClearColor("#06070d", 1)
          onReady?.()
        }}
      >
        <VisibilityPause />
        <CoreScene count={PARTICLE_COUNTS[tier]} activeRegion={activeRegion} />
      </Canvas>
      <MouseTracker enabled={!isCoarse} />
    </div>
  )
}
