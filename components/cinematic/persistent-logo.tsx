"use client"

import { forwardRef } from "react"
import { LogoScene } from "@/components/cinematic/logo-scene"
import { useIsMobile } from "@/lib/use-media-query"

/** Слот определяет только положение и базовую непрозрачность (см. globals.css). */
export type LogoSlot = "hero" | "contact"

/**
 * Один канвас логотипа на весь PanelStack: стоит у экрана-героя и у контактов,
 * между ними прячется. Положение переключается через data-logo-slot вместо
 * ремонта каждой секции по отдельности — секции просто оставляют для него место.
 *
 * Слот принципиально принимает только "hero" и "contact". Раньше был ещё
 * вариант "hidden", у которого в CSS задана лишь opacity: 0 — без inset, top,
 * width и transform. Из-за этого при переходе от контактов к продуктам знак
 * мгновенно телепортировался в левый верхний угол (позиционирование пропадало),
 * и только потом гас. Затухание теперь ведётся отдельной обёрткой по скроллу,
 * поэтому положение остаётся неизменным.
 */
export const PersistentLogo = forwardRef<HTMLDivElement, { slot: LogoSlot; live: boolean }>(
  function PersistentLogo({ slot, live }, fadeRef) {
    const isMobile = useIsMobile()

    return (
      <div data-logo-slot={slot} aria-hidden="true" className="pointer-events-none absolute z-[6]">
        {/* Непрозрачность ведётся из PanelStack прямо по прогрессу скролла —
            без перехода по времени, поэтому знак не «догоняет» прокрутку. */}
        <div ref={fadeRef} className="h-full w-full" style={{ opacity: 0 }}>
          <LogoScene className="h-full w-full" interactive={!isMobile} visible={live} />
        </div>
      </div>
    )
  },
)
