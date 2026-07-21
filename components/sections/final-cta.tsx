"use client"

import { usePanel } from "@/lib/panel-context"
import { MagneticButton } from "@/components/effects/magnetic-button"
import { ScrollReveal } from "@/components/effects/scroll-reveal"

export function FinalCta() {
  const { openPanel } = usePanel()

  return (
    <section id="contact" className="container-shell py-12 sm:py-16">
      <ScrollReveal>
        <div className="grid-glow gradient-border-animated overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/50 px-6 py-10 backdrop-blur sm:px-10 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Обсудим ваш проект</h2>
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
                href="#cases"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base font-medium text-white/85 transition hover:bg-white/10"
              >
                Посмотреть кейсы
              </MagneticButton>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
