"use client"

import { useEffect } from "react"
import { sceneState } from "@/lib/scene-store"

export function MouseTracker({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) {
      sceneState.mouseInfluence = 0
      return
    }
    sceneState.mouseInfluence = 1

    const onMove = (event: PointerEvent) => {
      sceneState.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      sceneState.mouse.y = -((event.clientY / window.innerHeight) * 2 - 1)
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [enabled])

  return null
}
