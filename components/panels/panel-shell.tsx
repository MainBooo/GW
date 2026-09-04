"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"
import { useFocusTrap } from "@/lib/use-focus-trap"

type Side = "right" | "left" | "bottom"

const sideOffset: Record<Side, { x?: string; y?: string }> = {
  right: { x: "100%" },
  left: { x: "-100%" },
  bottom: { y: "100%" },
}

const sideClasses: Record<Side, string> = {
  right: "inset-y-0 right-0 h-full",
  left: "inset-y-0 left-0 h-full",
  bottom: "inset-x-0 bottom-0 max-h-[92vh] rounded-t-[28px]",
}

export function PanelShell({
  side,
  title,
  ariaLabel,
  onClose,
  widthClassName,
  children,
  id,
}: {
  side: Side
  title: string
  ariaLabel: string
  onClose: () => void
  widthClassName?: string
  children: ReactNode
  id?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useBodyScrollLock(true)
  useFocusTrap(containerRef, true)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  const offset = sideOffset[side]
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <div className="fixed inset-0 z-[70]">
      <motion.div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        ref={containerRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        data-safe-x={side !== "bottom" ? side : undefined}
        data-safe-bottom={side === "bottom" ? "" : undefined}
        className={[
          "absolute glass-panel-strong shadow-glow-lg overflow-y-auto overscroll-contain",
          sideClasses[side],
          widthClassName ?? "w-full sm:w-[480px]",
        ].join(" ")}
        initial={{ opacity: 0, ...offset }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, ...offset }}
        transition={transition}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-surface-strong px-5 py-4 backdrop-blur-md sm:px-7">
          <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M1 1L15 15M15 1L1 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-6 sm:px-7 sm:py-8">{children}</div>
      </motion.div>
    </div>
  )
}
