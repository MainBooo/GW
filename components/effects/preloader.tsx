"use client"

import { useEffect, useRef, useState } from "react"

const CRITICAL_IMAGES = ["/logo/generationweb.svg", "/projects/growth-engine/dashboard.png"]

const STAGES = ["INITIALIZING SYSTEM", "LOADING INTERFACES", "CONNECTING AGENTS"]

export function Preloader({ canvasReady, onDone }: { canvasReady: boolean; onDone: () => void }) {
  const [display, setDisplay] = useState(0)
  const [stage, setStage] = useState(0)
  const [skippable, setSkippable] = useState(false)
  const [closing, setClosing] = useState(false)
  const targetRef = useRef(0)
  const resolvedRef = useRef(0)
  const finishedRef = useRef(false)
  const canvasReadyRef = useRef(canvasReady)
  canvasReadyRef.current = canvasReady

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    setClosing(true)
    window.setTimeout(onDone, 520)
  }

  useEffect(() => {
    const total = CRITICAL_IMAGES.length + 1
    const bump = () => {
      resolvedRef.current += 1
      const ratio = resolvedRef.current / total
      targetRef.current = Math.min(canvasReadyRef.current ? 100 : 92, Math.round(ratio * 92))
    }

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(bump).catch(bump)
    } else {
      bump()
    }

    CRITICAL_IMAGES.forEach((src) => {
      const img = new window.Image()
      img.onload = bump
      img.onerror = bump
      img.src = src
    })

    const skipTimer = window.setTimeout(() => setSkippable(true), 1100)
    return () => window.clearTimeout(skipTimer)
  }, [])

  useEffect(() => {
    if (canvasReady) {
      targetRef.current = 100
    }
  }, [canvasReady])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      setDisplay((prev) => {
        const next = prev + (targetRef.current - prev) * 0.12
        const clamped = targetRef.current - next < 0.4 ? targetRef.current : next
        setStage(Math.min(STAGES.length - 1, Math.floor((clamped / 100) * STAGES.length)))
        if (clamped >= 99.6) {
          window.setTimeout(finish, 260)
          return 100
        }
        return clamped
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      role="status"
      aria-label="Загрузка Generation Core"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-2xl transition-opacity duration-500 ease-out-soft ${
        closing ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 px-6 text-center font-mono">
        <div className="text-xs uppercase tracking-[0.4em] text-white/50">GENERATION CORE</div>

        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border border-primary/30" />
          <div
            className="absolute inset-0 rounded-full border-t-2 border-secondary"
            style={{ transform: `rotate(${display * 3.6}deg)` }}
          />
          <div className="absolute inset-3 rounded-full bg-primary/20 blur-md" />
        </div>

        <div className="text-3xl font-semibold tabular-nums text-white">{Math.round(display)}%</div>

        <div className="h-px w-full overflow-hidden bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-secondary via-accent to-primary transition-[width] duration-200"
            style={{ width: `${display}%` }}
          />
        </div>

        <div className="text-[11px] uppercase tracking-[0.25em] text-white/40" aria-live="polite">
          {STAGES[stage]}
        </div>

        {skippable && (
          <button
            type="button"
            onClick={finish}
            className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/35 underline-offset-4 transition hover:text-white/70 hover:underline"
          >
            Пропустить →
          </button>
        )}
      </div>
    </div>
  )
}
