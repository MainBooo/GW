"use client"

import Image from "next/image"
import { usePanel } from "@/lib/panel-context"
import { PanelShell } from "@/components/panels/panel-shell"
import { reputationOsScreens } from "@/lib/content"

const capabilities = [
  { title: "Единый inbox", text: "Все отзывы и упоминания из подключённых источников в одной ленте." },
  { title: "Источники", text: "Карты, отзовики, соцсети и другие площадки под мониторингом." },
  { title: "Аналитика", text: "Рейтинг, тональность и динамика отзывов по компании." },
  { title: "AI-ответы", text: "AI-черновики ответов на отзывы для быстрой и точной коммуникации." },
  { title: "Уведомления", text: "Оповещения о новых отзывах и упоминаниях без ручного мониторинга." },
]

export function ReputationOsPanel() {
  const { closePanel } = usePanel()

  return (
    <PanelShell side="left" title="ReputationOS" ariaLabel="Кейс: ReputationOS" onClose={closePanel} widthClassName="w-full sm:w-[640px] lg:w-[760px]">
      <p className="text-[17px] leading-8 text-white/80">
        Платформа мониторинга отзывов и упоминаний с аналитикой, уведомлениями и AI-черновиками ответов.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {capabilities.map((cap) => (
          <div key={cap.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white">{cap.title}</div>
            <p className="mt-1.5 text-xs leading-5 text-white/55">{cap.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/40">Интерфейс</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {reputationOsScreens.map((screen) => (
            <figure key={screen.src} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <Image
                src={screen.src}
                alt={`ReputationOS — ${screen.label}`}
                width={1600}
                height={900}
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

      <a
        href="https://reputationos.generationweb.ru"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/10 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-accent/15"
      >
        Открыть сайт продукта
        <span aria-hidden="true">→</span>
      </a>
    </PanelShell>
  )
}
