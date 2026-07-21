"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { useIsCoarsePointer } from "@/lib/use-media-query"

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const isCoarsePointer = useIsCoarsePointer()
  // Stay disabled until mounted so the first client render matches the server's (avoids a hydration mismatch).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const disabled = !mounted || prefersReducedMotion || isCoarsePointer

  useEffect(() => {
    if (disabled) return

    let frame = 0
    const onPointerMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        ref.current?.style.setProperty("--cursor-x", `${event.clientX}px`)
        ref.current?.style.setProperty("--cursor-y", `${event.clientY}px`)
      })
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      cancelAnimationFrame(frame)
    }
  }, [disabled])

  if (disabled) return null

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />
}
