"use client"

import { useEffect, useRef, useState } from "react"
import type { SceneDisposer } from "@/lib/webgl/core/scene-lifecycle"

export type SceneSlug = "particles" | "glass" | "market"

/**
 * Сцены написаны обычными TS-модулями и ничего не знают о React: точка входа
 * получает контейнер, сама вешает слушатели, RAF и WebGL-контекст и возвращает
 * функцию освобождения. Здесь нужен только монтаж в ref и вызов этой функции
 * при размонтировании: при переходах роутером события pagehide нет, и без
 * явного освобождения контексты копились бы, пока браузер не начал убивать
 * самые старые.
 */
const LOADERS: Record<SceneSlug, () => Promise<(root: HTMLElement) => SceneDisposer>> = {
  particles: () => import("@/lib/webgl/scenes/particles/main").then((m) => m.initParticlesScene),
  glass: () => import("@/lib/webgl/scenes/glass/main").then((m) => m.initGlassScene),
  market: () => import("@/lib/webgl/scenes/market/main").then((m) => m.initMarketScene),
}

interface Props {
  slug: SceneSlug
  /** Текстовое описание внутри canvas — читается скринридером. */
  description: string
  fallbackAlt: string
  withTooltip?: boolean
}

export function WebglScene({ slug, description, fallbackAlt, withTooltip = false }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let disposed = false
    let dispose: SceneDisposer | null = null

    LOADERS[slug]()
      .then((init) => {
        if (disposed) return
        dispose = init(root)
      })
      .catch(() => {
        if (!disposed) setFailed(true)
      })

    return () => {
      disposed = true
      // Сцена могла ещё не догрузиться — тогда освобождать нечего, а флаг
      // выше не даст ей смонтироваться в уже снятый со страницы контейнер.
      dispose?.()
    }
  }, [slug])

  return (
    <div
      ref={rootRef}
      data-scene={slug}
      className="scene-viewport relative aspect-[16/9] w-full overflow-hidden bg-[#05060a]"
    >
      <canvas className="scene-canvas absolute inset-0 block h-full w-full touch-none">{description}</canvas>

      {/*
        src подставляется скриптом сцены только когда WebGL2 недоступен:
        браузер грузит изображение даже под display:none, и посетители
        с рабочим WebGL качали бы фоллбэк впустую.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="scene-fallback absolute inset-0 h-full w-full object-cover"
        data-fallback-src={`/cases/fallback/${slug}.webp`}
        alt={fallbackAlt}
        hidden
      />

      {failed && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/60">
          Не удалось загрузить сцену. Обновите страницу или откройте её в другом браузере.
        </p>
      )}

      {withTooltip && <pre className="scene-tooltip" role="status" hidden />}
    </div>
  )
}
