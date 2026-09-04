"use client"

import { PanelProvider, usePanel } from "@/lib/panel-context"
import { LenisProvider } from "@/lib/lenis-provider"
import { CustomCursor } from "@/components/effects/custom-cursor"
import { CinematicOverlay } from "@/components/effects/cinematic-overlay"
import { Header } from "@/components/sections/header"
import { PanelRoot } from "@/components/panels/panel-root"
import { PanelStack, type CinematicPanel } from "@/components/cinematic/panel-stack"
import { HeroScreen } from "@/components/cinematic/screens/hero-screen"
import { ServicesScreen } from "@/components/cinematic/screens/services-screen"
import { ProductsScreen } from "@/components/cinematic/screens/products-screen"
import { ContactScreen } from "@/components/cinematic/screens/contact-screen"

/**
 * Футажи — Coverr, лицензия «Royalty-Free for Commercial Use», без
 * атрибуции (проверено на странице лицензии сайта). Обрезаны до 9 секунд
 * и пережаты под вес фона на автовоспроизведении (1.7–2.6 МБ на ролик).
 * Источники разобраны в public/videos/SOURCES.md. Файлы и порядок роликов
 * зафиксированы — менять нельзя.
 */
function buildPanels(openContact: () => void): CinematicPanel[] {
  return [
    {
      id: "hero",
      videoSrc: "/videos/mist.mp4",
      content: () => <HeroScreen onOpenContact={openContact} />,
    },
    {
      id: "services",
      anchorId: "services",
      videoSrc: "/videos/thesis.mp4",
      content: () => <ServicesScreen onOpenContact={openContact} />,
    },
    {
      id: "products",
      anchorId: "products",
      videoSrc: "/videos/proof.mp4",
      content: () => <ProductsScreen />,
    },
    {
      id: "contact",
      anchorId: "contact",
      videoSrc: "/videos/forest.mp4",
      content: () => <ContactScreen onOpenContact={openContact} />,
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
      <CinematicOverlay />
      <CustomCursor />
      <main id="top" className="relative z-10 bg-background text-white">
        <Header />
        <CinematicBody />
      </main>
      <PanelRoot />
    </PanelProvider>
  )
}
