"use client"

import { useEffect, useState } from "react"

const WORDS = [
  "SaaS platforms",
  "analytics dashboards",
  "monitoring systems",
  "internal tools",
]

export default function TypedServices() {
  const [mounted, setMounted] = useState(false)
  const [index, setIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const current = WORDS[index]

    const timeout = setTimeout(() => {

      if (!deleting && subIndex < current.length) {
        setSubIndex((v) => v + 1)
        return
      }

      if (!deleting && subIndex === current.length) {
        setTimeout(() => setDeleting(true), 800)
        return
      }

      if (deleting && subIndex > 0) {
        setSubIndex((v) => v - 1)
        return
      }

      if (deleting && subIndex === 0) {
        setDeleting(false)
        setIndex((v) => (v + 1) % WORDS.length)
      }

    }, deleting ? 70 : 130)   // ← в 2 раза медленнее

    return () => clearTimeout(timeout)

  }, [subIndex, index, deleting, mounted])

  if (!mounted) return null

  return (
    <span className="typed-text">
      {WORDS[index].substring(0, subIndex)}
      <span className="typed-caret">|</span>
    </span>
  )
}
