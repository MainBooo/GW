"use client"

import { useEffect, useRef, useState } from "react"

const words = ["AI-АГЕНТЫ", "SAAS-ПЛАТФОРМЫ", "АВТОМАТИЗАЦИЯ", "ВЕБ-ПРИЛОЖЕНИЯ"]

const SHOW_TIME = 2600
const OUT_TIME = 500

export function RotatingWord() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let mounted = true

    const run = () => {
      timeoutRef.current = setTimeout(() => {
        if (!mounted) return
        setVisible(false)

        timeoutRef.current = setTimeout(() => {
          if (!mounted) return
          setIndex((prev) => (prev + 1) % words.length)
          setVisible(true)
          run()
        }, OUT_TIME)
      }, SHOW_TIME)
    }

    run()

    return () => {
      mounted = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <span className="gw-rotating-text-wrap" aria-live="polite">
      <span key={index} className={visible ? "gw-rotating-word gw-word-in" : "gw-rotating-word gw-word-out"}>
        {words[index]}
      </span>
    </span>
  )
}
