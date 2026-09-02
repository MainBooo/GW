"use client"

import Link from "next/link"
import { PanelProvider } from "@/lib/panel-context"
import { Header } from "@/components/sections/header"
import { Footer } from "@/components/sections/footer"
import { PanelRoot } from "@/components/panels/panel-root"
import { WebglScene } from "@/components/cases/webgl-scene"
import type { CaseEntry } from "@/lib/cases-content"

/**
 * Оболочка страницы кейса. Провайдер панелей нужен потому, что Header и
 * PanelRoot общаются через него; тяжёлого фонового канваса главной здесь
 * намеренно нет — на странице уже своя WebGL-сцена, и два контекста
 * одновременно съедали бы кадровый бюджет впустую.
 */
export function CasePage({ entry, prev, next }: { entry: CaseEntry; prev: CaseEntry; next: CaseEntry }) {
  return (
    <PanelProvider>
      <main className="relative z-10 min-h-screen overflow-x-clip bg-background text-white">
        <Header />

        <div className="container-shell pt-28 sm:pt-32">
          <nav className="mb-6 text-[13px] text-white/45" aria-label="Хлебные крошки">
            <Link href="/" className="transition hover:text-white/80">
              Главная
            </Link>
            <span className="px-2">/</span>
            <Link href="/cases" className="transition hover:text-white/80">
              Кейсы
            </Link>
            <span className="px-2">/</span>
            <span className="text-white/70">{entry.title}</span>
          </nav>

          <h1 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            {entry.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/60">{entry.tagline}</p>
        </div>

        <div className="container-shell mt-8">
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-glow">
            <WebglScene
              slug={entry.slug}
              description={entry.sceneDescription}
              fallbackAlt={`Статичный кадр сцены «${entry.title}»`}
              withTooltip={entry.withTooltip}
            />
          </div>
          <p className="mt-3 text-[13px] text-white/40">
            Сцена интерактивна: двигайте курсором по изображению.
          </p>
        </div>

        <div className="container-shell mt-12">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <dl className="grid gap-5">
              <Row term="Техника" value={entry.technique} />
              <Row term="Что решает" value={entry.problem} />
              <Row term="Сроки" value={entry.timeframe} />
              <Row term="Ассеты" value={entry.codeOnly} />
            </dl>

            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Технологии</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {entry.stack.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-white/60"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[13px] leading-relaxed text-white/55">
                Инициативная работа: сделана как демонстрация возможностей, не по заказу клиента.
              </p>
            </div>
          </div>
        </div>

        <div className="container-shell mt-16">
          <div className="grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2">
            <Link
              href={`/cases/${prev.slug}`}
              className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/35">Предыдущий</span>
              <span className="mt-1 block text-sm text-white/80 transition group-hover:text-white">{prev.title}</span>
            </Link>
            <Link
              href={`/cases/${next.slug}`}
              className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 text-right transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/35">Следующий</span>
              <span className="mt-1 block text-sm text-white/80 transition group-hover:text-white">{next.title}</span>
            </Link>
          </div>
        </div>

        <Footer />
      </main>
      <PanelRoot />
    </PanelProvider>
  )
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid gap-1 border-t border-white/[0.07] pt-4 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-white/35">{term}</dt>
      <dd className="m-0 text-[15px] leading-relaxed text-white/70">{value}</dd>
    </div>
  )
}
