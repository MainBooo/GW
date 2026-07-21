"use client"

import { useRef } from "react"
import { services } from "@/lib/content"
import { usePanel } from "@/lib/panel-context"
import { useSceneTrack } from "@/lib/use-scene-track"

// GSAP's `progress` (start "top top" / end "bottom bottom") already spans exactly
// the CSS-sticky "stuck window", so 0..1 here is the full usable range — just leave
// a little headroom before 1 so the last item isn't still fading in as it releases.
const THRESHOLDS = [0.05, 0.28, 0.51, 0.74]

export function ChaosToSystem() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const { openPanel } = usePanel()

  useSceneTrack(sectionRef, {
    steps: ["stream", "chaos", "network"],
    start: "top top",
    end: "bottom bottom",
    onUpdate: (progress) => {
      if (headingRef.current) {
        const introT = Math.min(1, progress * 5)
        headingRef.current.style.opacity = String(introT)
        headingRef.current.style.transform = `translate3d(0, ${(1 - introT) * 24}px, 0)`
      }
      itemRefs.current.forEach((el, i) => {
        if (!el) return
        const threshold = THRESHOLDS[i]
        const t = Math.max(0, Math.min(1, (progress - threshold) / 0.18))
        el.style.opacity = String(t)
        el.style.transform = `translate3d(${(1 - t) * (i % 2 === 0 ? -18 : 18)}px, 0, 0)`
      })
    },
  })

  return (
    <section ref={sectionRef} id="services" className="relative" style={{ height: "220vh" }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="container-shell relative z-10">
          <div ref={headingRef} className="mx-auto max-w-3xl text-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-secondary/70">01–04 · Направления</div>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
              ТЫСЯЧИ СИГНАЛОВ.
              <br />
              ОДНА РАБОТАЮЩАЯ СИСТЕМА.
            </h2>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:gap-6">
            {services.map((service, i) => (
              <div
                key={service.id}
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                className={`opacity-0 ${i % 2 === 0 ? "lg:mr-10" : "lg:ml-10"}`}
              >
                <button
                  type="button"
                  onClick={() => openPanel("service", { serviceId: service.id })}
                  data-cursor-el
                  className="group w-full rounded-[24px] border border-white/10 bg-background/40 p-5 text-left backdrop-blur-md transition hover:border-secondary/30 hover:bg-white/[0.04] sm:p-6"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-xs text-white/35">{service.index}</span>
                    <span className="text-white/30 transition group-hover:translate-x-1 group-hover:text-white/70">→</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white sm:text-xl">{service.title}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-white/60 sm:text-[15px]">{service.short}</p>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
