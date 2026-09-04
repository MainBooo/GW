/**
 * Мутируемое состояние прогресса /lab, читаемое императивно в useFrame глав
 * (тот же приём, что и lib/logo-scroll-state.ts — быстрый скролл не должен
 * гонять React-реконсиляцию на каждый тик).
 */
export interface LabScrollState {
  /** Индекс активной главы (0 = Identity, 1 = Laptop). */
  chapter: number
  /** Прогресс 0..1 внутри активной главы. */
  local: number
}

export const labScrollState: LabScrollState = {
  chapter: 0,
  local: 0,
}
