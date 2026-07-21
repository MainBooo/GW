"use client"

import { useRef } from "react"
import { usePanel } from "@/lib/panel-context"
import { useSceneTrack } from "@/lib/use-scene-track"
import { MagneticButton } from "@/components/effects/magnetic-button"
import { ScrollReveal } from "@/components/effects/scroll-reveal"

export function FinalCta() {
  const { openPanel } = usePanel()
  const sectionRef = useRef<HTMLDivElement>(null)

  useSceneTrack(sectionRef, {
    steps: ["ecosystem", "portal"],
    start: "top top",
    end: "bottom bottom",
  })

  return (
    <section ref={sectionRef} id="contact" className="relative" style={{ height: "180vh" }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="container-shell relative z-10">
          <ScrollReveal>
            <div className="grid-glow gradient-border-animated mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-background/55 px-6 py-10 text-center backdrop-blur-xl sm:px-10 sm:py-14">
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
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
