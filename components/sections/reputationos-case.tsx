"use client"

import Image from "next/image"
import { usePanel } from "@/lib/panel-context"
import { ScrollReveal } from "@/components/effects/scroll-reveal"
import { MagneticButton } from "@/components/effects/magnetic-button"

const highlights = [
  "Единый inbox отзывов и упоминаний",
  "Источники: карты, отзовики, соцсети",
  "Аналитика рейтинга и тональности",
  "AI-черновики ответов на отзывы",
  "Уведомления о новых упоминаниях",
]

export function ReputationOsCase() {
  const { openPanel } = usePanel()

  return (
    <section className="container-shell py-10 sm:py-14">
      <ScrollReveal>
        <div className="grid-glow overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/50 p-6 backdrop-blur sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-accent/25 bg-accent/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-accent">
                Кейс · SaaS-платформа
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">ReputationOS</h2>
              <p className="mt-4 text-[16px] leading-7 text-white/72">
                Платформа мониторинга отзывов и упоминаний с аналитикой, уведомлениями и AI-черновиками ответов.
              </p>

              <ul className="mt-6 space-y-3 text-[15px] leading-7 text-white/78">
                {highlights.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-[5px] text-accent">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <MagneticButton
                onClick={() => openPanel("reputationos")}
                className="mt-7 inline-flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/10 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-accent/15"
              >
                Открыть кейс
                <span aria-hidden="true">→</span>
              </MagneticButton>
            </div>

            <button
              type="button"
              onClick={() => openPanel("reputationos")}
              className="group relative overflow-hidden rounded-2xl border border-white/10 text-left"
              aria-label="Открыть подробный кейс ReputationOS"
            >
              <Image
                src="/projects/reputationos/inbox.jpeg"
                alt="ReputationOS — единый inbox отзывов и упоминаний"
                width={1600}
                height={800}
                className="h-64 w-full object-cover object-top transition duration-500 group-hover:scale-[1.03] sm:h-96"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
              <div className="absolute bottom-4 left-4 text-sm font-medium text-white">Реальный интерфейс продукта →</div>
            </button>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
