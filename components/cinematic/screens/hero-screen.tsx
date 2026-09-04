"use client"

import Link from "next/link"
import { Eyebrow } from "@/components/cinematic/eyebrow"

export function HeroScreen({ onOpenContact }: { onOpenContact: () => void }) {
  return (
    <div className="container-shell relative flex h-full w-full items-center pt-20">
      <div className="relative z-10 grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="glass-cinema glass-cinema--logo rounded-[28px] px-6 py-8 sm:px-10 sm:py-12">
          <Eyebrow>INTERACTIVE WEB · MOTION · FULL-STACK</Eyebrow>
          <h1 className="mt-4 text-balance text-[2rem] font-light leading-[1.12] tracking-tight text-cream sm:text-4xl lg:text-[3rem]">
            Интерактивные сайты
            <br />и сложные веб-продукты
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-stone sm:text-base">
            Создаю современные сайты с продуманной анимацией, WebGL-эффектами и полноценной программной частью — от
            идеи до запуска.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onOpenContact}
              className="cta-bordeaux rounded-2xl border border-bordeaux-light/40 bg-gradient-to-r from-bordeaux to-bordeaux-light px-7 py-3.5 text-[15px] font-medium text-cream shadow-soft transition hover:scale-[1.02]"
            >
              Обсудить проект
            </button>
            <Link
              href="#products"
              className="rounded-2xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-[15px] font-medium text-cream/85 backdrop-blur-sm transition hover:bg-white/10"
            >
              Смотреть проекты
            </Link>
          </div>
        </div>

        {/* Правый столбец ничего не рендерит — под логотип место держит
            PersistentLogo на уровне PanelStack (один канвас на всю главную,
            здесь только сохраняется доля колонки в grid). */}
        <div aria-hidden="true" className="hidden h-[420px] lg:block xl:h-[480px]" />
      </div>
    </div>
  )
}
