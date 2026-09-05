"use client"

import { LogoScene } from "@/components/cinematic/logo-scene"
import { useIsMobile } from "@/lib/use-media-query"
import type { LogoVariant } from "@/lib/logo-scroll-state"

/**
 * Один канвас логотипа на весь PanelStack: виден и интерактивен на экране 1,
 * распадается между экранами, снова собирается на экране контактов. Позиция
 * переключается через data-variant (см. globals.css) вместо ремонта каждой
 * секции по отдельности — секции просто оставляют для него место.
 */
export function PersistentLogo({ variant, active = true }: { variant: LogoVariant; active?: boolean }) {
  const isMobile = useIsMobile()

  return (
    <div data-logo-slot={variant} aria-hidden="true" className="pointer-events-none absolute z-[6] transition-opacity duration-700">
      <LogoScene
        className="h-full w-full"
        interactive={!isMobile && variant !== "hidden"}
        // active=false — секция с логотипом вне экрана. В мобильной раскладке
        // канвасов два (герой и контакты), и рисовать оба одновременно незачем.
        visible={active && variant !== "hidden"}
      />
    </div>
  )
}
