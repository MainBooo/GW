"use client"

import { usePanel } from "@/lib/panel-context"
import { MagneticButton } from "@/components/effects/magnetic-button"
import { FloatingParticles } from "@/components/sections/floating-particles"
import { HeroShowcase } from "@/components/sections/hero-showcase"
import { RotatingWord } from "@/components/sections/rotating-word"

export function Hero() {
  const { openPanel } = usePanel()

  return (
    <section id="top" className="hero-section relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="hero-animated-gradient absolute inset-0 opacity-90" />
      <FloatingParticles />

      <div className="relative container-shell grid min-h-[calc(100vh-80px)] items-center gap-10 py-12 lg:grid-cols-[0.94fr_1.06fr] lg:gap-12 lg:py-20">
        <div className="max-w-[720px]">
          <div className="mb-5 inline-flex rounded-full border border-secondary/20 bg-secondary/10 px-5 py-2.5 text-sm text-secondary">
            GenerationWeb — AI-системы и веб-продукты для бизнеса
          </div>

          <h1 className="max-w-[760px] text-[44px] font-semibold leading-[0.96] tracking-[-0.05em] text-white sm:text-[56px] lg:text-[72px] xl:text-[84px]">
            СОЗДАЁМ ЦИФРОВЫЕ
            <br />
            СИСТЕМЫ БУДУЩЕГО
          </h1>

          <p className="mt-6 max-w-[760px] text-[17px] leading-[1.6] text-white/74 sm:mt-8 sm:text-[20px] lg:text-[22px]">
            Проектируем и разрабатываем AI-агентов, SaaS-платформы,
            внутренние системы и современные веб-приложения.
          </p>

          <div className="mt-6 flex items-center gap-3 text-[15px] sm:text-base">
            <span className="text-white/45">Разрабатываем:</span>
            <RotatingWord />
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <MagneticButton
              onClick={() => openPanel("contact")}
              className="cta-primary rounded-2xl border border-primary/30 bg-gradient-to-r from-primary to-secondary px-7 py-4 text-base font-medium text-white shadow-soft"
            >
              Обсудить проект
            </MagneticButton>
            <MagneticButton
              href="#cases"
              className="rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-base font-medium text-white/85 transition hover:bg-white/10"
            >
              Смотреть кейсы
            </MagneticButton>
          </div>
        </div>

        <HeroShowcase />
      </div>
    </section>
  )
}
