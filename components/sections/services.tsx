"use client"

import { services } from "@/lib/content"
import { usePanel } from "@/lib/panel-context"
import { TiltCard } from "@/components/effects/tilt-card"
import { ScrollReveal } from "@/components/effects/scroll-reveal"

const accents = [
  { glow: "hover:shadow-[0_20px_60px_rgba(41,169,255,0.18)]", border: "hover:border-secondary/30", icon: "bg-secondary/15", gradient: "via-secondary/80" },
  { glow: "hover:shadow-[0_20px_60px_rgba(128,107,255,0.18)]", border: "hover:border-primary/30", icon: "bg-primary/15", gradient: "via-primary/80" },
  { glow: "hover:shadow-[0_20px_60px_rgba(51,230,195,0.18)]", border: "hover:border-accent/30", icon: "bg-accent/15", gradient: "via-accent/80" },
]

export function Services() {
  const { openPanel } = usePanel()

  return (
    <section id="services" className="container-shell py-8 sm:py-14">
      <ScrollReveal>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Направления работы</h2>
            <p className="mt-3 max-w-2xl text-white/65">
              Фокус на продуктах, где важны AI-логика, архитектура, надёжный backend и понятный интерфейс.
            </p>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid gap-5 md:grid-cols-3">
        {services.map((service, index) => {
          const a = accents[index % accents.length]
          return (
            <ScrollReveal key={service.id} delay={index * 0.08}>
              <TiltCard className={`group section-glass grid-glow relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/50 p-6 backdrop-blur transition-colors duration-300 ${a.glow} ${a.border}`}>
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${a.gradient} to-transparent`} />

                <div className="mb-5 flex items-center justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 ${a.icon} text-lg text-white`}>
                    ✦
                  </div>
                  <div className="text-xs font-medium uppercase tracking-[0.22em] text-white/28">{service.index}</div>
                </div>

                <h3 className="text-[26px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[28px]">
                  {service.title}
                </h3>

                <p className="mt-4 text-[16px] leading-7 text-white/76">{service.short}</p>

                <button
                  type="button"
                  onClick={() => openPanel("service", { serviceId: service.id })}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                >
                  Подробнее
                  <span aria-hidden="true">→</span>
                </button>
              </TiltCard>
            </ScrollReveal>
          )
        })}
      </div>
    </section>
  )
}
