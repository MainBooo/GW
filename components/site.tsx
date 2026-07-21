"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import { PanelProvider, usePanel } from "@/lib/panel-context"
import { LenisProvider } from "@/lib/lenis-provider"
import { sceneState } from "@/lib/scene-store"
import { CustomCursor } from "@/components/effects/custom-cursor"
import { CinematicOverlay } from "@/components/effects/cinematic-overlay"
import { Preloader } from "@/components/effects/preloader"
import { Header } from "@/components/sections/header"
import { Hero } from "@/components/sections/hero"
import { DataTicker } from "@/components/effects/data-ticker"
import { ChaosToSystem } from "@/components/sections/chaos-to-system"
import { GrowthEngineScene } from "@/components/sections/growth-engine-scene"
import { ReputationOsScene } from "@/components/sections/reputationos-scene"
import { ProcessScene } from "@/components/sections/process-scene"
import { TechMapScene } from "@/components/sections/tech-map-scene"
import { FinalCta } from "@/components/sections/final-cta"
import { Footer } from "@/components/sections/footer"
import { PanelRoot } from "@/components/panels/panel-root"

const GenerationCoreCanvas = dynamic(() => import("@/components/core/generation-core-canvas"), {
  ssr: false,
})

const INTRO_KEY = "gw_core_intro_seen"

function PageContent() {
  const { activePanel } = usePanel()
  const panelOpen = activePanel !== null
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    ;(el as HTMLDivElement & { inert: boolean }).inert = panelOpen
  }, [panelOpen])

  useEffect(() => {
    sceneState.panelOpen = panelOpen
    sceneState.timeScale = panelOpen ? 0.25 : 1
    sceneState.mouseInfluence = panelOpen ? 0 : 1
  }, [panelOpen])

  return (
    <div
      ref={ref}
      className="transition-[transform,filter] duration-300 ease-out-soft"
      style={{
        transform: panelOpen ? "scale(0.97)" : "scale(1)",
        filter: panelOpen ? "brightness(0.7) blur(1px)" : "brightness(1)",
      }}
      aria-hidden={panelOpen}
    >
      <main className="relative z-10 overflow-x-hidden bg-transparent text-white">
        <Header />
        <Hero />
        <DataTicker />
        <ChaosToSystem />
        <GrowthEngineScene />
        <ReputationOsScene />
        <ProcessScene />
        <TechMapScene />
        <FinalCta />
        <Footer />
      </main>
    </div>
  )
}

export default function Site() {
  const [canvasReady, setCanvasReady] = useState(false)
  const [showPreloader, setShowPreloader] = useState(true)
  const [skipIntro, setSkipIntro] = useState(false)

  useEffect(() => {
    if (window.sessionStorage.getItem(INTRO_KEY)) {
      setSkipIntro(true)
      setShowPreloader(false)
    }
  }, [])

  const handlePreloaderDone = () => {
    window.sessionStorage.setItem(INTRO_KEY, "1")
    setShowPreloader(false)
  }

  return (
    <PanelProvider>
      <LenisProvider />
      <GenerationCoreCanvas onReady={() => setCanvasReady(true)} />
      <CinematicOverlay />
      <CustomCursor />
      {showPreloader && !skipIntro && <Preloader canvasReady={canvasReady} onDone={handlePreloaderDone} />}
      <PageContent />
      <PanelRoot />
    </PanelProvider>
  )
}
