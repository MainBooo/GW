"use client"

import { useEffect, useRef } from "react"
import { PanelProvider, usePanel } from "@/lib/panel-context"
import { CursorGlow } from "@/components/effects/cursor-glow"
import { Header } from "@/components/sections/header"
import { Hero } from "@/components/sections/hero"
import { DirectionsMarquee } from "@/components/sections/directions-marquee"
import { Services } from "@/components/sections/services"
import { GrowthEngineCase } from "@/components/sections/growth-engine-case"
import { ReputationOsCase } from "@/components/sections/reputationos-case"
import { Process } from "@/components/sections/process"
import { TechStack } from "@/components/sections/tech-stack"
import { FinalCta } from "@/components/sections/final-cta"
import { Footer } from "@/components/sections/footer"
import { PanelRoot } from "@/components/panels/panel-root"

function PageContent() {
  const { activePanel } = usePanel()
  const panelOpen = activePanel !== null
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // `inert` prevents keyboard/screen-reader access to background content
    // while a panel is open; not yet in @types/react, so set imperatively.
    ;(el as HTMLDivElement & { inert: boolean }).inert = panelOpen
  }, [panelOpen])

  return (
    <div
      ref={ref}
      className="transition-[transform,filter] duration-300 ease-out-soft"
      style={{
        transform: panelOpen ? "scale(0.985)" : "scale(1)",
        filter: panelOpen ? "brightness(0.7)" : "brightness(1)",
      }}
      aria-hidden={panelOpen}
    >
      <CursorGlow />
      <main className="overflow-x-hidden bg-background text-white">
        <Header />
        <Hero />
        <DirectionsMarquee />
        <Services />
        <GrowthEngineCase />
        <ReputationOsCase />
        <Process />
        <TechStack />
        <FinalCta />
        <Footer />
      </main>
    </div>
  )
}

export default function Site() {
  return (
    <PanelProvider>
      <PageContent />
      <PanelRoot />
    </PanelProvider>
  )
}
