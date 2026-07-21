"use client"

import Image from "next/image"
import { usePanel } from "@/lib/panel-context"

export function Header() {
  const { openPanel } = usePanel()

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl">
      <div className="container-shell flex h-20 items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-3">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 shadow-soft">
            <Image src="/logo/generationweb.svg" alt="GenerationWeb" width={44} height={44} className="rounded-xl" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight text-white">GenerationWeb</div>
            <div className="text-sm text-muted">AI-системы и веб-продукты</div>
          </div>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-white/80 md:flex" aria-label="Основная навигация">
          <a href="#services" className="transition hover:text-white">Услуги</a>
          <a href="#cases" className="transition hover:text-white">Кейсы</a>
          <a href="#process" className="transition hover:text-white">Процесс</a>
          <a href="#tech" className="transition hover:text-white">Технологии</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openPanel("contact")}
            className="cta-primary hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:scale-[1.02] sm:inline-flex"
          >
            Обсудить проект
          </button>

          <button
            type="button"
            onClick={() => openPanel("menu")}
            aria-label="Открыть меню"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
              <path d="M1 1H17M1 7H17M1 13H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
