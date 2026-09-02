"use client"

import { PanelProvider } from "@/lib/panel-context"
import { Header } from "@/components/sections/header"
import { Footer } from "@/components/sections/footer"
import { PanelRoot } from "@/components/panels/panel-root"
import { CaseCards } from "@/components/cases/case-cards"

export function CasesIndex() {
  return (
    <PanelProvider>
      <main className="relative z-10 min-h-screen overflow-x-clip bg-background text-white">
        <Header />

        <div className="container-shell pt-28 sm:pt-32">
          <p className="text-[11px] uppercase tracking-[0.14em] text-accent">Кейсы</p>
          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Интерактивная графика, построенная целиком кодом
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/60">
            Три сцены на WebGL2: вычисления на GPU, знаковые поля расстояния и процедурная геометрия
            по реальным данным. Ни одной импортированной 3D-модели, ни одной готовой текстуры, ни одного
            стороннего изображения — статичные кадры и превью экспортированы из этих же сцен.
          </p>
        </div>

        <div className="container-shell mt-12 pb-8">
          <CaseCards />
        </div>

        <Footer />
      </main>
      <PanelRoot />
    </PanelProvider>
  )
}
