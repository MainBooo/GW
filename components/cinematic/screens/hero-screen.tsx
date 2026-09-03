"use client"

import Link from "next/link"
import { Eyebrow } from "@/components/cinematic/eyebrow"
import { LogoScene } from "@/components/cinematic/logo-scene"

export function HeroScreen({
  onOpenContact,
  mounted,
  spinning,
}: {
  onOpenContact: () => void
  mounted: boolean
  spinning: boolean
}) {
  return (
    <div className="container-shell relative flex h-full w-full items-center pt-20">
      {/* Мобильный сценарий: логотип уходит на фон, приглушённый и без
          пойнтер-событий, чтобы не мешать чтению текста поверх. Отступ
          сверху — чтобы форма не наезжала на плашку хедера. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-24 z-0 opacity-[0.14] lg:hidden">
        <LogoScene mounted={mounted} spinning={spinning} className="h-full w-full" />
      </div>

      <div className="relative z-10 grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="glass-cinema rounded-[28px] px-6 py-8 sm:px-10 sm:py-12">
          <Eyebrow>WEBGL · THREE.JS · FULL-STACK</Eyebrow>
          <h1 className="mt-4 text-balance text-[2rem] font-light leading-[1.12] tracking-tight text-cream sm:text-4xl lg:text-[3rem]">
            Интерактивные сайты и 3D‑сцены, готовые к продакшену
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-stone sm:text-base">
            Подключаюсь к проектам агентств или создаю сайт целиком: WebGL, сложная анимация, интеграция и деплой.
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
              Смотреть продукты
            </Link>
          </div>
        </div>

        {/* Десктоп: логотип на весь свой отдельный столбец, поверх видео,
            без стекла — стекло только у текстовой панели. */}
        <div className="relative hidden h-[420px] lg:block xl:h-[480px]">
          <LogoScene mounted={mounted} spinning={spinning} className="h-full w-full" />
        </div>
      </div>
    </div>
  )
}
