"use client"

import { useEffect, useState, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  const prefersReducedMotion = useReducedMotion()
  // Stay in the "animated" branch until mounted so the first client render matches
  // the server's, regardless of the visitor's OS-level reduced-motion setting.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const reduced = mounted && prefersReducedMotion

  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 1 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduced ? 0 : 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
