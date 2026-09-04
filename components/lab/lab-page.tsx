"use client"

import { PanelProvider } from "@/lib/panel-context"
import { Header } from "@/components/sections/header"
import { Footer } from "@/components/sections/footer"
import { PanelRoot } from "@/components/panels/panel-root"
import { LabStack } from "@/components/lab/lab-stack"

export function LabPage() {
  return (
    <PanelProvider>
      <main className="relative z-10 min-h-screen overflow-x-clip bg-background text-white">
        <Header />

        <div className="container-shell pt-28 sm:pt-32">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
            Эксперименты и демонстрации
          </span>
          <h1 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            WebGL Lab
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/60">
            Интерактивные эксперименты с пространством, движением и цифровыми объектами.
          </p>
        </div>

        <div className="mt-10">
          <LabStack />
        </div>

        <Footer />
      </main>
      <PanelRoot />
    </PanelProvider>
  )
}
