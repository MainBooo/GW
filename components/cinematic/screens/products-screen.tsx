"use client"

import Image from "next/image"
import { Eyebrow } from "@/components/cinematic/eyebrow"

const PRODUCTS = [
  {
    name: "ReputationOS",
    text: "Платформа мониторинга отзывов и веб-упоминаний: единый inbox, аналитика рейтинга и тональности, уведомления и AI-черновики ответов.",
    href: "https://reputationos.generationweb.ru",
    cta: "Открыть ReputationOS",
    screenshot: "/projects/reputationos/hero-mockup.jpg",
  },
  {
    name: "Strategy Lab",
    text: "Платформа для тестирования торговых стратегий на исторических данных с интерактивными графиками и режимом Market Replay.",
    href: "https://strategylab.generationweb.ru",
    cta: "Открыть Strategy Lab",
    screenshot: "/projects/strategylab/hero-dashboard.jpg",
  },
]

export function ProductsScreen() {
  return (
    <div className="container-shell flex h-full w-full items-center overflow-y-auto pt-24 pb-10">
      <div className="mx-auto w-full max-w-5xl">
        <Eyebrow>LIVE PRODUCTS</Eyebrow>
        <h2 className="mt-4 max-w-xl text-balance text-[1.75rem] font-light leading-[1.15] tracking-tight text-cream sm:text-3xl lg:text-4xl">
          Не демонстрации. Работающие продукты.
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-stone">
          Собственные системы, спроектированные, разработанные и запущенные в production.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {PRODUCTS.map((product) => (
            <div key={product.name} className="glass-cinema flex flex-col overflow-hidden rounded-[24px]">
              <div className="relative aspect-[3/2] w-full border-b border-white/10">
                <Image
                  src={product.screenshot}
                  alt={`Интерфейс ${product.name}`}
                  fill
                  className="object-cover object-top"
                  sizes="(min-width: 1024px) 46vw, 92vw"
                />
              </div>
              <div className="flex flex-1 flex-col px-6 py-6 sm:px-7 sm:py-7">
                <h3 className="text-lg font-medium text-cream">{product.name}</h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-stone">{product.text}</p>
                <a
                  href={product.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[13.5px] font-medium text-cream/90 backdrop-blur-sm transition hover:bg-white/10"
                >
                  {product.cta} ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
