"use client"

import Image from "next/image"
import { usePanel } from "@/lib/panel-context"
import { ScrollReveal } from "@/components/effects/scroll-reveal"
import { MagneticButton } from "@/components/effects/magnetic-button"
import { PipelineAnimation } from "@/components/pipeline/pipeline-animation"

export function GrowthEngineCase() {
  const { openPanel } = usePanel()

  return (
    <section id="cases" className="container-shell py-10 sm:py-14">
      <ScrollReveal>
        <div className="mb-8">
          <div className="mb-3 inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-primary">
            Кейс · AI-агенты
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Growth Engine</h2>
          <p className="mt-3 max-w-2xl text-white/65">
            Мультиагентная система поиска потенциальных клиентов. Она планирует поиск, собирает компании,
            исследует их, оценивает соответствие предложению, находит контакты и подготавливает данные
            для первого обращения.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="grid-glow overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/50 p-6 backdrop-blur sm:p-8">
          <PipelineAnimation />

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <button
              type="button"
              onClick={() => openPanel("growth-engine")}
              className="group relative overflow-hidden rounded-2xl border border-white/10 text-left"
              aria-label="Открыть подробный кейс Growth Engine"
            >
              <Image
                src="/projects/growth-engine/dashboard.png"
                alt="Growth Engine — реальный дашборд кампаний лид-хантинга"
                width={1600}
                height={1000}
                className="h-64 w-full object-cover object-top transition duration-500 group-hover:scale-[1.03] sm:h-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
              <div className="absolute bottom-4 left-4 text-sm font-medium text-white">Реальный интерфейс продукта →</div>
            </button>

            <div>
              <p className="text-[16px] leading-7 text-white/72">
                Полный пайплайн — от планирования кампании до контактов для первого обращения.
                Каждый агент наблюдаем: видно статус, время выполнения и историю запусков.
              </p>
              <MagneticButton
                onClick={() => openPanel("growth-engine")}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-primary/15"
              >
                Открыть кейс
                <span aria-hidden="true">→</span>
              </MagneticButton>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
