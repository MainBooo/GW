"use client"

import { Eyebrow } from "@/components/cinematic/eyebrow"

const CAPABILITIES = [
  {
    n: "01",
    title: "WebGL и Three.js",
    text: "Интерактивные 3D-сцены, шейдеры, продуктовые презентации и визуальные эффекты.",
  },
  {
    n: "02",
    title: "Сайты нового поколения",
    text: "Продуманная структура, сложная анимация, адаптивный интерфейс и production-деплой.",
  },
  {
    n: "03",
    title: "SaaS и AI-системы",
    text: "Frontend, backend, базы данных, очереди, интеграции и AI-агенты.",
  },
]

export function ServicesScreen({ onOpenContact }: { onOpenContact: () => void }) {
  return (
    <div className="container-shell flex h-full w-full items-center pt-20">
      <div className="glass-cinema mx-auto w-full max-w-4xl rounded-[28px] px-6 py-10 sm:px-10 sm:py-14">
        <Eyebrow>CAPABILITIES</Eyebrow>
        <h2 className="mt-4 max-w-xl text-balance text-[1.75rem] font-light leading-[1.15] tracking-tight text-cream sm:text-3xl lg:text-4xl">
          Подключаюсь к сложной части проекта
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-stone">
          Могу встроиться в команду агентства как технический подрядчик или взять разработку целиком.
        </p>

        <div className="mt-10 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-3 sm:gap-6">
          {CAPABILITIES.map((item, i) => (
            <div
              key={item.n}
              className={`pt-6 sm:pt-0 ${i > 0 ? "border-t border-white/10 sm:border-l sm:border-t-0 sm:pl-6" : ""}`}
            >
              <span className="font-mono text-[11px] text-sand/70">{item.n}</span>
              <h3 className="mt-2 text-[17px] font-medium text-cream">{item.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-stone">{item.text}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenContact}
          className="mt-10 rounded-2xl border border-bordeaux-light/40 bg-gradient-to-r from-bordeaux to-bordeaux-light px-7 py-3.5 text-[15px] font-medium text-cream shadow-soft transition hover:scale-[1.02]"
        >
          Обсудить задачу
        </button>
      </div>
    </div>
  )
}
