"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { PanelProvider } from "@/lib/panel-context"
import { Header } from "@/components/sections/header"
import { Footer } from "@/components/sections/footer"
import { PanelRoot } from "@/components/panels/panel-root"

// Сцена тянет three.js и не рендерится на сервере: WebGL-контекста там нет.
const ProductStage = dynamic(
  () => import("@/components/cases/product-stage").then((m) => m.ProductStage),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#07080c]" /> },
)

const FACTS = [
  { term: "Роль", value: "Продукт целиком: архитектура, бэкенд, воркеры, интерфейс, эксплуатация" },
  { term: "Тип", value: "Мультиарендная SaaS-платформа, собственный продукт" },
  { term: "Стек", value: "NestJS · PostgreSQL · Prisma · Redis · BullMQ · Next.js · Playwright" },
]

const CAPABILITIES = [
  {
    title: "Единый инбокс",
    body: "Отзывы с Яндекс Карт, 2ГИС и веб-страниц собираются в одну ленту с фильтрами по площадке, тональности и оценке.",
  },
  {
    title: "AI-черновики ответов",
    body: "Модель готовит вариант ответа с учётом тональности и контекста компании; публикует человек, а не автомат.",
  },
  {
    title: "Аналитика репутации",
    body: "Динамика рейтинга и тональности по периодам. Тренд строится только по фактическим снимкам, без достроенных значений.",
  },
  {
    title: "Мультиарендность",
    body: "Изоляция арендаторов на стороне бэкенда и воркеров: источником прав всегда остаётся сервер, а не интерфейс.",
  },
]

export function ReputationOsCase() {
  return (
    <PanelProvider>
      <main className="relative z-10 min-h-screen overflow-x-clip bg-background text-white">
        <Header />

        <section className="relative">
          <div className="h-[62vh] min-h-[420px] w-full sm:h-[74vh]">
            <ProductStage screenshot="/projects/reputationos/dashboard-analytics.jpeg" className="h-full w-full" />
          </div>

          {/* Текст поверх нижней части кадра — как в киношной подаче продукта */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent pt-32">
            <div className="container-shell pb-10">
              <p className="text-[11px] uppercase tracking-[0.14em] text-accent">Кейс · SaaS-платформа</p>
              <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                ReputationOS
              </h1>
              <p className="mt-4 max-w-2xl text-base text-white/60">
                Управление онлайн-репутацией: отзывы со всех площадок в одном инбоксе, AI-черновики
                ответов и аналитика, на которую можно опереться.
              </p>
            </div>
          </div>
        </section>

        <section className="container-shell mt-14">
          <dl className="grid gap-5 sm:grid-cols-3">
            {FACTS.map((fact) => (
              <div key={fact.term} className="border-t border-white/10 pt-4">
                <dt className="text-[11px] uppercase tracking-[0.14em] text-white/35">{fact.term}</dt>
                <dd className="mt-2 text-[14px] leading-relaxed text-white/70">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="container-shell mt-20">
          <h2 className="max-w-2xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Задача
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/60">
            У компании с несколькими филиалами отзывы разбросаны по площадкам: Яндекс Карты, 2ГИС,
            профильные сайты. Их никто не видит целиком, ответы пишутся вручную и с задержкой,
            а динамику рейтинга невозможно объяснить цифрами.
          </p>
        </section>

        <section className="container-shell mt-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Что внутри</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {CAPABILITIES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-white/20"
              >
                <h3 className="text-[15px] font-medium text-white">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container-shell mt-20 mb-8">
          <div className="flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px] text-white/60">Платформа работает и доступна для демонстрации.</p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://reputationos.generationweb.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-primary/30 bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-[13px] font-medium text-white transition hover:scale-[1.03]"
              >
                Открыть ReputationOS
              </a>
              <Link
                href="/cases"
                className="rounded-full border border-white/15 px-5 py-2.5 text-[13px] text-white/75 transition hover:border-white/30 hover:text-white"
              >
                Все кейсы
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
      <PanelRoot />
    </PanelProvider>
  )
}
