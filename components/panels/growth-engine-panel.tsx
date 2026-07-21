"use client"

import Image from "next/image"
import { usePanel } from "@/lib/panel-context"
import { PanelShell } from "@/components/panels/panel-shell"
import { PipelineAnimation } from "@/components/pipeline/pipeline-animation"
import { AnimatedCounter } from "@/components/effects/animated-counter"
import { growthEngineScreens } from "@/lib/content"

const stats = [
  { value: 105, suffix: "", label: "лидов найдено" },
  { value: 24, suffix: "", label: "кампаний запущено" },
  { value: 42.9, suffix: "%", label: "конверсия в оценённые", decimals: 1 },
  { value: 54.4, suffix: "", label: "средний score", decimals: 1 },
]

export function GrowthEnginePanel() {
  const { closePanel } = usePanel()

  return (
    <PanelShell side="right" title="Growth Engine" ariaLabel="Кейс: Growth Engine" onClose={closePanel} widthClassName="w-full sm:w-[640px] lg:w-[760px]">
      <p className="text-[17px] leading-8 text-white/80">
        Мультиагентная система поиска потенциальных клиентов. Она планирует поиск, собирает компании,
        исследует их, оценивает соответствие предложению, находит контакты и подготавливает данные
        для первого обращения.
      </p>

      <div className="mt-8">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/40">Pipeline</h3>
        <PipelineAnimation />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-2xl font-semibold text-white">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={stat.decimals ?? 0} />
            </div>
            <div className="mt-1 text-xs leading-4 text-white/50">{stat.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-white/35">Реальные данные из продукта на момент публикации кейса.</p>

      <div className="mt-10">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/40">Интерфейс</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {growthEngineScreens.map((screen) => (
            <figure key={screen.src} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <Image
                src={screen.src}
                alt={`Growth Engine — ${screen.label}`}
                width={1600}
                height={1000}
                loading="lazy"
                className="w-full object-cover object-top"
              />
              <figcaption className="px-4 py-3 text-xs text-white/55">
                <span className="font-medium text-white/80">{screen.label}.</span> {screen.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </PanelShell>
  )
}
