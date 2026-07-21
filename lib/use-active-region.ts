"use client"

import { useEffect, useState } from "react"
import { sceneState } from "@/lib/scene-store"

export type ActiveRegion = "none" | "pipeline" | "tech"

function regionFor(name: string): ActiveRegion {
  if (name.startsWith("pipeline-")) return "pipeline"
  if (name === "ecosystem") return "tech"
  return "none"
}

/**
 * Polls (rather than subscribes) because sceneState is a plain mutable object read
 * imperatively by useFrame — this avoids mounting the always-on Html-anchored label
 * groups (12 real DOM portals) for the ~80% of the page where they're irrelevant.
 */
export function useActiveRegion(): ActiveRegion {
  const [region, setRegion] = useState<ActiveRegion>("none")

  useEffect(() => {
    const id = window.setInterval(() => {
      const a = regionFor(sceneState.checkpointA)
      const b = regionFor(sceneState.checkpointB)
      const next = a !== "none" ? a : b !== "none" ? b : "none"
      setRegion((prev) => (prev === next ? prev : next))
    }, 150)
    return () => window.clearInterval(id)
  }, [])

  return region
}
