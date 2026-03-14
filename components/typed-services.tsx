"use client"

import { useEffect, useRef, useState } from "react"

const services = [
  "SaaS-платформы",
  "аналитические dashboards",
  "системы мониторинга",
  "internal tools",
]

const SHOW_TIME = 2600
const OUT_TIME = 4160

export default function TypedServices() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let mounted = true

    const run = () => {
      timeoutRef.current = setTimeout(() => {
        if (!mounted) return

        setVisible(false)

        timeoutRef.current = setTimeout(() => {
          if (!mounted) return
          setIndex((prev) => (prev + 1) % services.length)
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
    <div className="relative h-[40px] flex items-center overflow-hidden">

      <span
        className={[
          "block whitespace-nowrap text-left",
          "text-lg md:text-xl lg:text-2xl font-semibold",
          "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent",
          "transform-gpu",
          "transition-all ease-[cubic-bezier(0.19,1,0.22,1)]",
          visible
            ? "opacity-100 translate-x-0 blur-0 duration-[900ms]"
            : "opacity-0 -translate-x-8 blur-[6px] duration-[4160ms]",
        ].join(" ")}
      >
        {services[index]}
      </span>

    </div>
  )
}
