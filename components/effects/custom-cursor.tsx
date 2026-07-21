"use client"

import { useEffect, useRef, useState } from "react"
import { useIsCoarsePointer } from "@/lib/use-media-query"

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const isCoarsePointer = useIsCoarsePointer()
  const [mounted, setMounted] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mql.matches)
    const onChange = () => setReduced(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  const disabled = !mounted || isCoarsePointer || reduced

  useEffect(() => {
    if (disabled) return

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ring = { x: target.x, y: target.y }
    let hovering = false
    let label = ""

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX
      target.y = event.clientY

      const el = (event.target as HTMLElement)?.closest?.(
        "a, button, [role='button'], input, textarea, select, [data-cursor-el]",
      )
      hovering = !!el
      label = (el as HTMLElement)?.dataset?.cursorLabel ?? ""
    }

    window.addEventListener("pointermove", onMove, { passive: true })

    let raf = 0
    const tick = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.x - 3}px, ${target.y - 3}px, 0)`
      }
      ring.x += (target.x - ring.x) * 0.18
      ring.y += (target.y - ring.y) * 0.18
      if (ringRef.current) {
        const scale = hovering ? 1.9 : 1
        ringRef.current.style.transform = `translate3d(${ring.x - 18}px, ${ring.y - 18}px, 0) scale(${scale})`
        ringRef.current.style.opacity = hovering ? "0.9" : "0.5"
      }
      if (labelRef.current) {
        labelRef.current.style.transform = `translate3d(${ring.x + 22}px, ${ring.y + 14}px, 0)`
        labelRef.current.style.opacity = label ? "1" : "0"
        if (labelRef.current.textContent !== label) labelRef.current.textContent = label
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    document.body.style.cursor = "none"

    return () => {
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
      document.body.style.cursor = ""
    }
  }, [disabled])

  if (disabled) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      <div ref={dotRef} className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-white will-change-transform" />
      <div
        ref={ringRef}
        className="fixed left-0 top-0 h-9 w-9 rounded-full border border-white/50 shadow-[0_0_20px_rgba(128,107,255,0.35)] transition-[opacity] duration-150 will-change-transform"
      />
      <span
        ref={labelRef}
        className="fixed left-0 top-0 font-mono text-[10px] uppercase tracking-[0.25em] text-white/70 opacity-0 transition-opacity duration-150 will-change-transform"
      />
    </div>
  )
}
