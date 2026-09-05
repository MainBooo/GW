"use client"

import Image from "next/image"
import Link from "next/link"
import { Eyebrow } from "@/components/cinematic/eyebrow"

const PRODUCTS = [
  {
    name: "ReputationOS",
    type: "SaaS · мониторинг репутации",
    text: "Платформа мониторинга отзывов и веб-упоминаний: единый Inbox, аналитика, уведомления и AI-помощник.",
    href: "https://reputationos.generationweb.ru",
    cta: "Открыть ReputationOS",
    screenshot: "/projects/reputationos/hero-mockup.jpg",
  },
  {
    name: "Strategy Lab",
    type: "SaaS · бэктестинг стратегий",
    text: "Платформа для тестирования торговых стратегий на исторических данных с интерактивными графиками и режимом Market Replay.",
    href: "https://strategylab.generationweb.ru",
    cta: "Открыть Strategy Lab",
    screenshot: "/projects/strategylab/hero-dashboard.jpg",
  },
]

export function ProductsScreen() {
  return (
    <div className="container-shell flex h-full w-full items-center pt-24 pb-10">
      <div className="mx-auto w-full max-w-5xl">
        <Eyebrow>PRODUCTS</Eyebrow>
        <h2 className="mt-4 max-w-xl text-balance text-[1.75rem] font-light leading-[1.15] tracking-tight text-cream sm:text-3xl lg:text-4xl">
          Собственные продукты, работающие в production
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-stone">
          Системы, которые были спроектированы, разработаны и самостоятельно доведены до запуска.
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
                <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-cream/90 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_currentColor]" />
                  Production
                </span>
              </div>
              <div className="flex flex-1 flex-col px-6 py-6 sm:px-7 sm:py-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-medium text-cream">{product.name}</h3>
                  <span className="font-mono text-[11px] text-sand/70">{product.type}</span>
                </div>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-stone">{product.text}</p>
                <a
                  href={product.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[13.5px] font-medium text-cream/90 backdrop-blur-sm transition hover:bg-white/10 hover:border-white/25 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
                >
                  {product.cta} ↗
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* ЭТАП 6: компактный анонс Lab — без превью логотипа/тяжёлых сцен,
            только текст и ссылка; сами сцены грузятся только на /lab. */}
        <div className="glass-cinema mt-6 flex flex-col items-start gap-4 rounded-[24px] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <Eyebrow>WEBGL LAB</Eyebrow>
            <h3 className="mt-2 text-lg font-medium text-cream">Интерактивные эксперименты</h3>
            <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-stone">
              Исследую, как фирменные знаки, цифровые продукты и простая геометрия могут превращаться в выразительные
              WebGL-сцены.
            </p>
            <p className="mt-1.5 text-[12px] text-stone/60">Эксперименты и демонстрации — не клиентские кейсы.</p>
          </div>
          <Link
            href="/lab"
            className="shrink-0 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-[13.5px] font-medium text-cream/90 backdrop-blur-sm transition hover:bg-white/10 hover:border-white/25 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
          >
            Открыть WebGL Lab →
          </Link>
        </div>
      </div>
    </div>
  )
}
