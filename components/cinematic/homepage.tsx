"use client"

import { PanelProvider, usePanel } from "@/lib/panel-context"
import { LenisProvider } from "@/lib/lenis-provider"
import { CustomCursor } from "@/components/effects/custom-cursor"
import { Header } from "@/components/sections/header"
import { Footer } from "@/components/sections/footer"
import { PanelRoot } from "@/components/panels/panel-root"
import { PanelStack, type CinematicPanel } from "@/components/cinematic/panel-stack"

/**
 * Футажи — Coverr, лицензия «Royalty-Free for Commercial Use», без
 * атрибуции (проверено на странице лицензии сайта). Обрезаны до 9 секунд
 * и пережаты под вес фона на автовоспроизведении (1.7–2.6 МБ на ролик).
 * Источники разобраны в public/videos/SOURCES.md.
 */
function buildPanels(openContact: () => void): CinematicPanel[] {
  return [
    {
      id: "intro",
      eyebrow: "GenerationWeb · Web Studio",
      heading: "Разработка, которая доводится до продакшена",
      sub: "AI-агенты, SaaS-платформы и веб-приложения — от архитектуры до запуска.",
      placeholderClass: "cinematic-mist cinematic-grain",
      videoSrc: "/videos/mist.mp4",
    },
    {
      id: "thesis",
      eyebrow: "Подход",
      heading: "Не макет, а работающая система",
      sub: "Бэкенд, фоновые обработчики, интеграции и эксплуатация — не только интерфейс.",
      placeholderClass: "cinematic-ocean cinematic-grain",
      videoSrc: "/videos/thesis.mp4",
    },
    {
      id: "proof",
      eyebrow: "Доказательство",
      heading: "ReputationOS и Strategy Lab работают прямо сейчас",
      sub: "Не демонстрации — платформы с реальными пользователями и данными.",
      placeholderClass: "cinematic-space cinematic-grain",
      videoSrc: "/videos/proof.mp4",
    },
    {
      id: "cta",
      eyebrow: "Начать",
      heading: "Расскажите, что нужно построить",
      sub: "Отвечаю в течение дня.",
      placeholderClass: "cinematic-forest cinematic-grain",
      videoSrc: "/videos/forest.mp4",
      cta: { label: "Обсудить проект", onClick: openContact },
    },
  ]
}

function CinematicBody() {
  const { openPanel } = usePanel()
  return <PanelStack panels={buildPanels(() => openPanel("contact"))} />
}

export function CinematicHomepage() {
  return (
    <PanelProvider>
      <LenisProvider />
      <CustomCursor />
      <main id="top" className="relative z-10 bg-background text-white">
        <Header />
        <CinematicBody />
        <Footer />
      </main>
      <PanelRoot />
    </PanelProvider>
  )
}
