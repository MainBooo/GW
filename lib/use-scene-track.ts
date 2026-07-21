"use client"

import { useEffect, type RefObject } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { CHECKPOINTS } from "@/components/core/shapes"
import { setCheckpointPair, setCameraPair, sceneState, type CheckpointName } from "@/lib/scene-store"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export type SceneTrackOptions = {
  steps: CheckpointName[]
  start?: string
  end?: string
  scrub?: boolean | number
  onUpdate?: (progress: number, stepIndex: number, stepLocalT: number) => void
}

export function useSceneTrack(triggerRef: RefObject<HTMLElement | null>, options: SceneTrackOptions) {
  const stepsKey = options.steps.join("|")

  useEffect(() => {
    const el = triggerRef.current
    if (!el) return
    const steps = options.steps
    if (steps.length < 2) return

    const applyProgress = (progress: number) => {
      const totalSteps = steps.length - 1
      const raw = Math.min(totalSteps - 0.0001, Math.max(0, progress) * totalSteps)
      const stepIndex = Math.max(0, Math.min(totalSteps - 1, Math.floor(raw)))
      const stepLocalT = raw - stepIndex
      const a = steps[stepIndex]
      const b = steps[stepIndex + 1]
      setCheckpointPair(a, b, stepLocalT)
      const defA = CHECKPOINTS[a]
      const defB = CHECKPOINTS[b]
      setCameraPair(defA.camera, defB.camera, defA.look, defB.look)
      options.onUpdate?.(progress, stepIndex, stepLocalT)
    }

    if (sceneState.reduced) {
      applyProgress(1)
      return
    }

    // A ScrollTrigger fires onRefresh for every section at once on page load/resize,
    // each reporting its own progress — a section far below the current scroll
    // position still reports progress 0, which is indistinguishable from "just
    // entered". Only apply state for a section that's actually active or already
    // scrolled past (progress > 0); otherwise an unrelated section below the fold
    // clobbers whichever section is genuinely on screen.
    const maybeApply = (self: ScrollTrigger) => {
      if (self.isActive || self.progress > 0) applyProgress(self.progress)
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: options.start ?? "top top",
      end: options.end ?? "bottom bottom",
      scrub: options.scrub ?? true,
      onUpdate: (self) => maybeApply(self),
      onRefresh: (self) => maybeApply(self),
    })

    return () => {
      st.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerRef, stepsKey, options.start, options.end])
}
