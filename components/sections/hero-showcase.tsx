"use client"

import Image from "next/image"
import { useRef, type MouseEvent as ReactMouseEvent } from "react"
import { useReducedMotion } from "framer-motion"
import { useIsCoarsePointer } from "@/lib/use-media-query"

const layers = [
  {
    src: "/projects/reputationos/inbox.jpeg",
    alt: "ReputationOS — единый inbox отзывов и упоминаний",
    depth: 10,
    className:
      "absolute left-[24%] top-[8%] z-[5] w-[58%] opacity-90 sm:left-[18%] sm:top-[7%] sm:w-[58%]",
    baseTransform: "perspective(2200px) rotateY(-10deg) rotateX(3deg) scale(0.94) translateY(8px)",
  },
  {
    src: "/projects/growth-engine/agent-center.png",
    alt: "Growth Engine — Agent Center, статус AI-агентов пайплайна",
    depth: 26,
    className:
      "absolute left-[4%] top-[23%] z-[30] w-[92%] sm:left-[2%] sm:top-[24%] sm:w-[86%]",
    baseTransform: "perspective(2200px) rotateY(-8deg) rotateX(2deg) translateZ(40px)",
    priority: true,
  },
  {
    src: "/projects/growth-engine/analytics.png",
    alt: "Growth Engine — аналитика лидов и конверсии",
    depth: 16,
    className:
      "absolute left-[10%] top-[50%] z-[20] w-[82%] sm:left-[8%] sm:top-[58%] sm:w-[78%] lg:left-[10%] lg:top-[46%] lg:w-[74%]",
    baseTransform: "perspective(2200px) rotateY(-9deg) rotateX(2deg)",
  },
]

export function HeroShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const isCoarsePointer = useIsCoarsePointer()
  const parallaxDisabled = prefersReducedMotion || isCoarsePointer

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (parallaxDisabled) return
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5

    layers.forEach((layer, i) => {
      const node = el.querySelectorAll<HTMLDivElement>("[data-parallax-layer]")[i]
      if (!node) return
      const shiftX = px * layer.depth
      const shiftY = py * layer.depth
      node.style.transform = `${layer.baseTransform} translate3d(${shiftX}px, ${shiftY}px, 0)`
    })
  }

  const handleMouseLeave = () => {
    const el = containerRef.current
    if (!el) return
    el.querySelectorAll<HTMLDivElement>("[data-parallax-layer]").forEach((node, i) => {
      node.style.transform = layers[i].baseTransform
    })
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto h-[520px] w-full max-w-[900px] sm:h-[600px] lg:h-[760px] lg:max-w-[940px]"
    >
      <div className="absolute left-[14%] top-[6%] h-[180px] w-[180px] rounded-full bg-secondary/10 blur-3xl sm:h-[220px] sm:w-[220px]" />
      <div className="absolute right-[12%] top-[4%] h-[220px] w-[220px] rounded-full bg-primary/20 blur-3xl sm:h-[280px] sm:w-[280px]" />
      <div className="absolute bottom-[18%] left-[26%] h-[180px] w-[260px] rounded-full bg-accent/10 blur-3xl sm:h-[220px] sm:w-[380px]" />

      {layers.map((layer) => (
        <div
          key={layer.src}
          data-parallax-layer
          className={layer.className}
          style={{
            transform: layer.baseTransform,
            transformStyle: "preserve-3d",
            transition: parallaxDisabled ? undefined : "transform 260ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div className="overflow-hidden rounded-[24px] border border-primary/25 bg-[#0b0f1f]/78 shadow-glow-lg backdrop-blur will-change-transform sm:rounded-[32px]">
            <Image
              src={layer.src}
              alt={layer.alt}
              width={1600}
              height={1000}
              priority={layer.priority}
              className="w-full object-cover"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
