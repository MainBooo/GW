"use client"

import { useRef, type ReactNode, type MouseEvent as ReactMouseEvent } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useIsCoarsePointer } from "@/lib/use-media-query"

type MagneticButtonProps = {
  children: ReactNode
  className?: string
  strength?: number
  href?: string
  target?: string
  rel?: string
  onClick?: () => void
  ariaLabel?: string
}

export function MagneticButton({
  children,
  className,
  strength = 0.3,
  href,
  target,
  rel,
  onClick,
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const isCoarsePointer = useIsCoarsePointer()
  const disabled = prefersReducedMotion || isCoarsePointer

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (disabled) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = event.clientX - (rect.left + rect.width / 2)
    const relY = event.clientY - (rect.top + rect.height / 2)
    el.style.transform = `translate(${relX * strength}px, ${relY * strength}px)`
  }

  const handleMouseLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = "translate(0px, 0px)"
  }

  const Inner = href ? (
    <a href={href} target={target} rel={rel} onClick={onClick} aria-label={ariaLabel} className={className}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={className}>
      {children}
    </button>
  )

  return (
    <motion.div
      ref={ref}
      className="inline-block"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 220ms cubic-bezier(0.22,1,0.36,1)" }}
    >
      {Inner}
    </motion.div>
  )
}
