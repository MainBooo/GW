"use client"

import { useEffect, useState } from "react"

const typedWords = [
  "SaaS platforms",
  "analytics dashboards",
  "monitoring systems",
  "internal tools",
]

export default function TypedServices() {
  const [mounted, setMounted] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)
  const [displayed, setDisplayed] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const start = setTimeout(() => setMounted(true), 250)
    return () => clearTimeout(start)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const current = typedWords[wordIndex]
    const isDoneTyping = displayed === current
    const isDoneDeleting = displayed === ""

    const timeout = setTimeout(
      () => {
        if (!deleting) {
          if (isDoneTyping) {
            setDeleting(true)
            return
          }
          setDisplayed(current.slice(0, displayed.length + 1))
        } else {
          if (isDoneDeleting) {
            setDeleting(false)
            setWordIndex((prev) => (prev + 1) % typedWords.length)
            return
          }
          setDisplayed(current.slice(0, displayed.length - 1))
        }
      },
      !deleting && isDoneTyping ? 1100 : deleting ? 55 : 85
    )

    return () => clearTimeout(timeout)
  }, [mounted, displayed, deleting, wordIndex])

  return (
    <span className="typed-line">
      <span className="text-white/72">Фокус:</span>
      <span className="typed-slot">
        <span className="typed-text">{mounted ? displayed || "\u00A0" : "\u00A0"}</span>
        <span className="typed-caret" aria-hidden="true" />
      </span>
    </span>
  )
}
