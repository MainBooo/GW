"use client"

import { useRef } from "react"
import { useSceneTrack } from "@/lib/use-scene-track"
import { useIsCoarsePointer } from "@/lib/use-media-query"

export function TechMapScene() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const isCoarsePointer = useIsCoarsePointer()

  useSceneTrack(sectionRef, {
    steps: ["architecture", "ecosystem"],
    start: "top top",
    end: "bottom bottom",
    onUpdate: (progress) => {
      if (headingRef.current) {
        const t = Math.min(1, progress * 6)
        headingRef.current.style.opacity = String(t)
      }
    },
  })

  return (
    <section ref={sectionRef} id="tech" className="relative" style={{ height: "240vh" }}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        <div ref={headingRef} className="container-shell relative z-10 text-center opacity-0">
          <div className="inline-flex flex-col items-center gap-2 rounded-3xl border border-white/10 bg-background/50 px-6 py-4 backdrop-blur-md">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">GENERATION CORE</span>
            <span className="text-xs text-white/35">
              {isCoarsePointer ? "Технологическая карта" : "Наведите на узел, чтобы узнать больше"}
            </span>
          </div>
          <p className="mx-auto mt-6 max-w-md text-[13px] leading-6 text-white/40">
            Технологии, на которых реально построены наши продукты — включая Growth Engine и ReputationOS.
          </p>
        </div>
      </div>
    </section>
  )
}
