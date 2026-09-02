"use client"

import Link from "next/link"
import { CaseCards } from "@/components/cases/case-cards"

/**
 * Блок кейсов на главной. Обычная секция без ScrollTrigger и без собственной
 * WebGL-сцены: главную уже держит фоновый канвас Generation Core, и второй
 * контекст здесь стоил бы кадрового бюджета ради статичных карточек.
 *
 * Место в потоке выбрано не произвольно. Секции главной сцепены общими
 * контрольными точками (hero → chaos → growth → … → tech-map → final-cta),
 * и соседние читают один и тот же sceneState.progress. Вставка в середину
 * цепочки разрывает передачу: пока активна чужая точка «ecosystem», поверх
 * содержимого продолжают висеть подписи технологической карты. После
 * final-cta активная точка — «portal», DOM-оверлеев у неё нет.
 *
 * Собственный фон нужен по той же причине: канвас зафиксирован на весь экран
 * и просвечивает сквозь полупрозрачные карточки.
 */
export function CasesShowcase() {
  return (
    <section
      id="cases"
      className="relative scroll-mt-[94px] bg-background/95 py-24 backdrop-blur-md sm:py-32"
    >
      <div className="container-shell">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-accent">Кейсы</p>
            <h2 className="mt-3 max-w-2xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Интерактивная графика, построенная целиком кодом
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/55">
              Вычисления на GPU, знаковые поля расстояния и процедурная геометрия по реальным данным.
              Без импортированных моделей и готовых текстур.
            </p>
          </div>

          <Link
            href="/cases"
            data-cursor-el
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[13px] text-white/75 transition hover:border-white/30 hover:text-white"
          >
            Все кейсы
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
              <path d="M1 5h11M8.5 1.5 12 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="mt-10">
          <CaseCards />
        </div>
      </div>
    </section>
  )
}
