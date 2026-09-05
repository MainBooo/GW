"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { logoScrollState } from "@/lib/logo-scroll-state"
import { PersistentLogo, type LogoSlot } from "@/components/cinematic/persistent-logo"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export interface CinematicPanel {
  id: string
  /** DOM id для якорной навигации из Header (напр. "services"). Необязателен. */
  anchorId?: string
  videoSrc: string
  /** isNear — сосед активной панели: видео готовится заранее, тяжёлые сцены домонтируются. */
  content: (state: { isActive: boolean; isNear: boolean }) => ReactNode
}

type VideoState = "active" | "next" | "idle"

/** Ширина окна кроссфейда в «экранах». Строго < 0.5, иначе окна соседних
 *  панелей пересекутся и оба экрана окажутся видны одновременно. */
const CROSSFADE_SPAN = 0.49

/**
 * iOS в Low Power Mode иногда молча отклоняет автоплей — без poster кадр в
 * этот момент остаётся чёрным. poster закрывает паузу нужным кадром сразу.
 * Воспроизводится только активная панель: соседняя преднагружается
 * (preload="auto", без play), остальные — preload="none" и на паузе, чтобы
 * не тянуть все четыре ролика одновременно.
 */
function PanelVideo({ src, state }: { src: string; state: VideoState }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const apply = () => {
      if (state === "active" && !document.hidden) {
        el.preload = "auto"
        void el.play().catch(() => {})
      } else {
        el.pause()
        el.preload = state === "next" ? "auto" : "none"
      }
    }

    apply()
    document.addEventListener("visibilitychange", apply)
    window.addEventListener("pageshow", apply)
    return () => {
      document.removeEventListener("visibilitychange", apply)
      window.removeEventListener("pageshow", apply)
    }
  }, [state])

  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover"
      src={src}
      poster={src.replace(/\.mp4$/, ".jpg")}
      muted
      loop
      playsInline
      preload={state === "idle" ? "none" : "auto"}
    />
  )
}

export function PanelStack({ panels }: { panels: CinematicPanel[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  /** Передний план панели (карточка с текстом) — гаснет синхронно с фоном. */
  const contentRefs = useRef<(HTMLDivElement | null)[]>([])
  /** Обёртка контента: именно её мы сдвигаем, когда экран не помещается. */
  const innerRefs = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)
  const [inViewport, setInViewport] = useState(true)
  const [logoSlot, setLogoSlot] = useState<LogoSlot>("hero")
  const [logoLive, setLogoLive] = useState(true)
  /** Обёртка затухания логотипа — правится напрямую, без ререндера на кадр. */
  const logoFadeRef = useRef<HTMLDivElement>(null)

  /**
   * vh — высота запиненного экрана, overflows — насколько контент каждой
   * панели выше него. На десктопе везде 0. На телефоне «Услуги» и «Продукты»
   * в 100svh не помещаются: раньше их просто обрезало (уходил заголовок и
   * кнопка), теперь на эту разницу выделяется дополнительный ход скролла, и
   * содержимое проезжает вверх внутри экрана, не ломая пиннинг и кроссфейд.
   */
  const [metrics, setMetrics] = useState<{ vh: number; overflows: number[] }>(() => ({
    vh: 0,
    overflows: panels.map(() => 0),
  }))

  useEffect(() => {
    const sticky = stickyRef.current
    if (!sticky) return
    let frame = 0

    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const vh = sticky.clientHeight
        if (vh === 0) return
        const overflows = panels.map((_, i) => {
          const el = innerRefs.current[i]
          return el ? Math.max(0, el.scrollHeight - vh) : 0
        })
        setMetrics((prev) => {
          const same =
            prev.vh === vh &&
            prev.overflows.length === overflows.length &&
            prev.overflows.every((v, i) => Math.abs(v - overflows[i]) < 1)
          return same ? prev : { vh, overflows }
        })
      })
    }

    measure()
    // Контент меняет высоту от переносов строк, шрифтов и подгрузки картинок,
    // поэтому меряем не один раз, а следим за каждой обёрткой.
    const observer = new ResizeObserver(measure)
    observer.observe(sticky)
    innerRefs.current.forEach((el) => el && observer.observe(el))
    window.addEventListener("orientationchange", measure)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("orientationchange", measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- panels пересоздаётся на каждом рендере родителя; значим только состав, а высоты приходят из ResizeObserver
  }, [panels.length])

  /**
   * Раскладка в «экранах»: у панели i есть отрезок удержания [start, end]
   * длиной в её переполнение (0, если помещается), затем ровно 1 экран на
   * кроссфейд к следующей. При нулевых переполнениях это в точности прежняя
   * равномерная сетка, поэтому десктоп не меняется.
   */
  const layout = useMemo(() => {
    const { vh, overflows } = metrics
    const holds = panels.map((_, i) => (vh > 0 ? (overflows[i] ?? 0) / vh : 0))
    const starts: number[] = []
    const ends: number[] = []
    let cursor = 0
    for (let i = 0; i < panels.length; i += 1) {
      starts[i] = cursor
      ends[i] = cursor + holds[i]
      cursor = ends[i] + 1
    }
    const units = Math.max(ends[panels.length - 1] ?? 0, 0.0001)
    return { holds, starts, ends, units, overflows, vh }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- см. выше: panels нестабилен по ссылке, раскладка зависит только от количества панелей и замеров
  }, [metrics, panels.length])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const total = panels.length
    const { starts, ends, holds, units, overflows } = layout
    let lastActive = -1
    let lastSlot: LogoSlot = "hero"
    let lastLive = false

    /** Расстояние от позиции до отрезка удержания панели (0, если внутри). */
    const distanceTo = (pos: number, i: number) =>
      pos < starts[i] ? starts[i] - pos : pos > ends[i] ? pos - ends[i] : 0

    // Вынесено из onUpdate, чтобы то же состояние применялось сразу при
    // создании триггера и на refresh: ScrollTrigger со scrub не гарантирует
    // вызов onUpdate, пока пользователь реально не проскроллил.
    const applyProgress = (progress: number) => {
      const pos = progress * units

      let bestIndex = 0
      let bestDistance = Number.POSITIVE_INFINITY

      for (let i = 0; i < total; i += 1) {
        const d = distanceTo(pos, i)
        if (d < bestDistance) {
          bestDistance = d
          bestIndex = i
        }

        const opacity = String(Math.max(0, 1 - d / CROSSFADE_SPAN))
        const bg = layerRefs.current[i]
        const fg = contentRefs.current[i]
        if (bg) bg.style.opacity = opacity
        if (fg) fg.style.opacity = opacity

        // Внутренний ход: пока идём по отрезку удержания, контент проезжает
        // вверх ровно на своё переполнение — ни пикселя не теряется.
        const inner = innerRefs.current[i]
        if (inner) {
          const hold = holds[i]
          const travelled = hold > 0 ? Math.min(1, Math.max(0, (pos - starts[i]) / hold)) : 0
          const shift = travelled * (overflows[i] ?? 0)
          inner.style.transform = shift > 0 ? `translate3d(0, ${-shift}px, 0)` : ""
        }
      }

      if (bestIndex !== lastActive) {
        lastActive = bestIndex
        setActive(bestIndex)
      }

      // Логотип стоит у экрана-героя и у контактов — то же треугольное окно,
      // что и у кроссфейда, только относительно отрезков удержания первой и
      // последней панели.
      const heroWindow = Math.max(0, 1 - distanceTo(pos, 0))
      const contactWindow = Math.max(0, 1 - distanceTo(pos, total - 1))
      const inContact = contactWindow > heroWindow

      // У контактов знак НЕ разлетается. Там слот маленький и квадратный, а
      // разлёт уводит крайние узлы за пределы кадра (правый нижний узел уходит
      // примерно на 2.4 при полувидимой ширине ~1.4) — знак ломался и его
      // правый нижний край срезался. Разлёт остаётся только у героя, где слот
      // во весь экран.
      logoScrollState.assembly = inContact ? 1 : heroWindow

      // Затухание ведём напрямую по прогрессу, а не сменой варианта с
      // переходом по времени: смена слота теперь происходит только там, где
      // знак уже полностью прозрачен, поэтому его положение не «прыгает».
      //
      // Окно то же, что и у самой панели (CROSSFADE_SPAN), а не шире: иначе
      // знак «переживал» свой экран — при уходе с контактов вверх продукты
      // были видны уже на 78%, а логотип ещё на 24%, и поверх продуктов висел
      // его кусок. Теперь он гаснет ровно вместе со своим экраном.
      const logoDistance = distanceTo(pos, inContact ? total - 1 : 0)
      const fade = Math.max(0, 1 - logoDistance / CROSSFADE_SPAN)
      if (logoFadeRef.current) logoFadeRef.current.style.opacity = String(fade)

      const nextSlot: LogoSlot = inContact ? "contact" : "hero"
      if (nextSlot !== lastSlot) {
        lastSlot = nextSlot
        setLogoSlot(nextSlot)
      }

      const nextLive = fade > 0.01
      if (nextLive !== lastLive) {
        lastLive = nextLive
        setLogoLive(nextLive)
      }
      logoScrollState.variant = nextLive ? nextSlot : "hidden"
    }

    const st = ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => applyProgress(self.progress),
      onRefresh: (self) => applyProgress(self.progress),
    })

    applyProgress(st.progress)

    return () => st.kill()
  }, [panels.length, layout])

  // Отдельная защита от "фонового" воспроизведения: если вся секция целиком
  // ушла из вьюпорта (например, будущий контент ниже экрана 4), видео и
  // сцену останавливаем независимо от активного индекса.
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const observer = new IntersectionObserver(([entry]) => setInViewport(entry.isIntersecting), { threshold: 0 })
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [])

  // inert вешается на передний план: именно там живут ссылки и кнопки, фон
  // (видео + градиент) интерактивных элементов не содержит.
  useEffect(() => {
    contentRefs.current.forEach((el, i) => {
      if (el) el.inert = i !== active
    })
  }, [active])

  const videoState = (i: number): VideoState => {
    if (!inViewport) return "idle"
    if (i === active) return "active"
    if (Math.abs(i - active) === 1) return "next"
    return "idle"
  }

  // До первого замера высота задаётся в svh — ровно как раньше, поэтому первый
  // кадр совпадает с прежней раскладкой и ничего не «прыгает».
  const wrapHeight =
    layout.vh > 0 ? `${(layout.units + 1) * layout.vh}px` : `${panels.length * 100}svh`

  return (
    <div ref={wrapRef} style={{ height: wrapHeight }} className="relative">
      {panels.map(
        (p, i) =>
          p.anchorId && (
            <div
              key={`anchor-${p.anchorId}`}
              id={p.anchorId}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0"
              style={
                layout.vh > 0
                  ? { top: `${layout.starts[i] * layout.vh}px`, height: `${layout.vh}px` }
                  : { top: `${i * 100}svh`, height: "100svh" }
              }
            />
          ),
      )}

      {/*
        Фон (видео + затемнение) и передний план (карточка с текстом) панели
        разнесены в два отдельных слоя с ЯВНЫМИ z-index, между которыми стоит
        логотип: фон(1) < логотип(6) < карточка(10).

        Раньше это была одна общая обёртка на панель, и порядок отрисовки
        зависел от значения её прозрачности: при opacity ровно 1 обёртка не
        создаёт stacking context, поэтому вложенная карточка с z-10 попадала
        в корневой контекст и оказывалась НАД логотипом (z-6). Первый же тик
        скролла выставлял opacity 0.9969 — контекст появлялся, z-10 карточки
        замыкался внутри обёртки, и логотип скачком выходил поверх карточки и
        текста. Это и читалось как «логотип резко проявился при скролле».
        С явными z-index у обоих слоёв порядок больше не зависит от opacity.
      */}
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden bg-background">
        {panels.map((p, i) => (
          <div
            key={`bg-${p.id}`}
            ref={(el) => {
              layerRefs.current[i] = el
            }}
            className="absolute inset-0 z-[1]"
            style={{ opacity: i === 0 ? 1 : 0 }}
            aria-hidden="true"
          >
            <PanelVideo src={p.videoSrc} state={videoState(i)} />
            {/* Затемнение снизу — текст должен читаться на любом кадре */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/50" />
          </div>
        ))}

        <PersistentLogo ref={logoFadeRef} slot={logoSlot} live={logoLive} />

        {panels.map((p, i) => {
          const isActive = i === active
          const isNear = Math.abs(i - active) <= 1
          return (
            <div
              key={`fg-${p.id}`}
              ref={(el) => {
                contentRefs.current[i] = el
              }}
              className="absolute inset-0 z-10 overflow-hidden"
              style={{ opacity: i === 0 ? 1 : 0 }}
              aria-hidden={!isActive}
            >
              {/* min-h-full: обёртка не ниже экрана (короткий контент остаётся
                  по центру), но растёт под длинный — его мы и сдвигаем. */}
              <div
                ref={(el) => {
                  innerRefs.current[i] = el
                }}
                className="flex min-h-full w-full items-center will-change-transform"
              >
                {p.content({ isActive, isNear })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
