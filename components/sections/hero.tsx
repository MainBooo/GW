"use client"

import { useRef } from "react"
import { usePanel } from "@/lib/panel-context"
import { useIsMobile } from "@/lib/use-media-query"
import { useSceneTrack } from "@/lib/use-scene-track"
import { MagneticButton } from "@/components/effects/magnetic-button"
import { RotatingWord } from "@/components/sections/rotating-word"

export function Hero() {
  const { openPanel } = usePanel()
  const sectionRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const scrollHintRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  useSceneTrack(sectionRef, {
    steps: ["ring", "sphere", "stream"],
    start: "top top",
    end: "bottom top",
    onUpdate: (progress) => {
      const t = Math.min(1, progress)
      if (textRef.current) {
        textRef.current.style.opacity = String(Math.max(0, 1 - t * 1.6))
        textRef.current.style.transform = `translate3d(0, ${t * -46}px, 0) scale(${1 - t * 0.06})`
        textRef.current.style.filter = `blur(${t * 7}px)`
      }
      if (scrollHintRef.current) {
        scrollHintRef.current.style.opacity = String(Math.max(0, 1 - t * 5))
      }
    },
  })

  return (
    <section ref={sectionRef} id="top" className="relative isolate" style={{ height: isMobile ? "100svh" : "150vh" }}>
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden">
        <div ref={textRef} className="container-shell relative z-10 mx-auto max-w-[820px] text-center">
          <div
            data-cursor-el
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/[0.08] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.3em] text-secondary backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-secondary shadow-[0_0_8px_currentColor]" />
            AI SYSTEMS · SAAS · AUTOMATION
          </div>

          <h1 className="text-[13vw] font-semibold leading-[0.94] tracking-[-0.045em] text-white sm:text-[64px] md:text-[76px] lg:text-[92px]">
            СОЗДАЁМ
            <br />
            ЦИФРОВЫЕ СИСТЕМЫ,
            <br />
            <span className="bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
              КОТОРЫЕ РАБОТАЮТ
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-[560px] text-[16px] leading-[1.65] text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.55)] sm:text-[18px]">
            Проектируем AI-агентов, SaaS-платформы, внутренние системы и
            веб-приложения — от архитектуры до запуска.
          </p>

          <div className="mt-5 flex items-center justify-center gap-3 text-[14px] text-white/45 sm:text-[15px]">
            <span>Разрабатываем:</span>
            <RotatingWord />
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <MagneticButton
              onClick={() => openPanel("contact")}
              className="cta-primary rounded-2xl border border-primary/30 bg-gradient-to-r from-primary to-secondary px-7 py-4 text-base font-medium text-white shadow-soft"
            >
              Обсудить проект
            </MagneticButton>
            <MagneticButton
              href="#growth-engine"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-4 text-base font-medium text-white/85 backdrop-blur-sm transition hover:bg-white/10"
            >
              Посмотреть кейсы
            </MagneticButton>
          </div>
        </div>

        <div
          ref={scrollHintRef}
          className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/35"
        >
          <span>Scroll</span>
          <span className="relative h-8 w-px overflow-hidden bg-white/15">
            <span className="absolute inset-x-0 top-0 h-3 w-px animate-[scrollhint_1.8s_ease-in-out_infinite] bg-white/70" />
          </span>
        </div>
      </div>
    </section>
  )
}
