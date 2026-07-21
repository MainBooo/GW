"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { usePanel } from "@/lib/panel-context"
import { useSceneTrack } from "@/lib/use-scene-track"
import { MagneticButton } from "@/components/effects/magnetic-button"
import { FINAL_CTA_ENTER_END, FINAL_CTA_ENTER_START } from "@/lib/scene-store"

export function FinalCta() {
  const { openPanel } = usePanel()
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // sceneState.reduced (used by useSceneTrack's own reduced-motion branch) is set
  // by a sibling component's effect and isn't guaranteed to be ready before this
  // section's ScrollTrigger is created, so the card needs its own independent,
  // reactive reduced-motion check instead of depending on that race.
  const prefersReducedMotion = useReducedMotion()
  // Stay in the "animated" branch until mounted so the first client render
  // matches the server's regardless of the visitor's reduced-motion setting.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const reduced = mounted && prefersReducedMotion
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced

  useEffect(() => {
    if (!reduced || !cardRef.current) return
    cardRef.current.style.opacity = "1"
    cardRef.current.style.transform = "translate3d(0, 0, 0)"
  }, [reduced])

  useSceneTrack(sectionRef, {
    steps: ["ecosystem", "portal"],
    start: "top top",
    end: "bottom bottom",
    // Gated on the same progress value (and the same handoff budget) that drives
    // the tech-map nodes' fade-out, so the CTA card only starts appearing once
    // those nodes are guaranteed gone -- see ECOSYSTEM_EXIT_FADE in scene-store.
    onUpdate: (progress) => {
      const el = cardRef.current
      if (!el || reducedRef.current) return
      const span = FINAL_CTA_ENTER_END - FINAL_CTA_ENTER_START
      const t = Math.max(0, Math.min(1, (progress - FINAL_CTA_ENTER_START) / span))
      el.style.opacity = String(t)
      el.style.transform = `translate3d(0, ${(1 - t) * 24}px, 0)`
    },
  })

  return (
    <section ref={sectionRef} id="contact" className="relative scroll-mt-[94px]" style={{ height: "180vh" }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden pt-[94px] sm:pt-0">
        <div className="container-shell relative z-10">
          <div
            ref={cardRef}
            style={{ opacity: 0, transform: "translate3d(0, 24px, 0)" }}
            className="grid-glow gradient-border-animated mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-background/55 px-6 py-10 text-center backdrop-blur-xl sm:px-10 sm:py-14"
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary/70">Портал открыт</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Обсудим ваш проект</h2>
            <p className="mt-5 text-lg leading-8 text-white/72">
              Расскажите про задачу — AI-агент, SaaS-платформа, внутренняя система или веб-приложение.
              Сориентирую по срокам, стоимости и архитектуре решения.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <MagneticButton
                onClick={() => openPanel("contact")}
                className="cta-primary rounded-2xl border border-primary/30 bg-gradient-to-r from-primary to-secondary px-6 py-4 text-base font-medium text-white shadow-soft"
              >
                Обсудить проект
              </MagneticButton>
              <MagneticButton
                href="#growth-engine"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base font-medium text-white/85 transition hover:bg-white/10"
              >
                Посмотреть кейсы
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
