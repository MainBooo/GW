/**
 * Мутируемое общее состояние логотипа, обновляемое из onUpdate ScrollTrigger
 * в panel-stack.tsx на каждый тик скролла. Читается императивно в useFrame
 * логотипа (lib/logo-scroll-state.ts, не React state) — иначе быстрый скролл
 * гонял бы реконсиляцию React на каждый пиксель прокрутки.
 */
export type LogoVariant = "hero" | "hidden" | "contact"

export interface LogoScrollState {
  /** 0 — рёбра/узлы разлетелись, 1 — логотип полностью собран. */
  assembly: number
  variant: LogoVariant
}

export const logoScrollState: LogoScrollState = {
  assembly: 1,
  variant: "hero",
}
