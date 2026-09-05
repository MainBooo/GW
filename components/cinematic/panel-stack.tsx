"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { logoScrollState, type LogoVariant } from "@/lib/logo-scroll-state"
import { PersistentLogo } from "@/components/cinematic/persistent-logo"

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
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  /** Передний план панели (карточка с текстом) — гаснет синхронно с фоном. */
  const contentRefs = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)
  const [inViewport, setInViewport] = useState(true)
  const [logoVariant, setLogoVariant] = useState<LogoVariant>("hero")

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const total = panels.length
    let lastActive = -1
    let lastVariant: LogoVariant = "hero"

    // Вынесено из onUpdate, чтобы то же самое состояние можно было применить
    // немедленно при создании триггера и на refresh. Без этого сцена до
    // первого скролла жила на значениях по умолчанию: ScrollTrigger со scrub
    // не гарантирует вызов onUpdate, пока пользователь реально не проскроллил,
    // из-за чего первый же тик скролла скачком переводил логотип из
    // «разобранного» вида в собранный (рёбра втрое толще) — это и читалось как
    // «логотип резко проявился».
    const applyProgress = (progress: number) => {
        const raw = progress * (total - 1)
        // Треугольное окно: слой i виден там, где raw ближе всего к i, и
        // гаснет к соседям в радиусе CROSSFADE_SPAN (не на всём шаге между
        // экранами — при плотном контенте (карточки/кнопки/футер) широкий
        // блендинг двух экранов на 50/50 читается как наложение/поломка, а
        // не как переход, поэтому окно сознательно уже полного шага). Строго
        // < 0.5 — иначе соседние окна математически могут пересечься и оба
        // слоя окажутся видны одновременно; 0.49 почти убирает и обратный
        // артефакт (короткую "мёртвую зону" с обоими слоями на 0 на самой
        // середине перехода), оставляя минимальный запас от 0.5.
        const CROSSFADE_SPAN = 0.49
        for (let i = 0; i < total; i += 1) {
          const opacity = String(Math.max(0, 1 - Math.abs(raw - i) / CROSSFADE_SPAN))
          const bg = layerRefs.current[i]
          const fg = contentRefs.current[i]
          if (bg) bg.style.opacity = opacity
          if (fg) fg.style.opacity = opacity
        }

        const nextActive = Math.max(0, Math.min(total - 1, Math.round(raw)))
        if (nextActive !== lastActive) {
          lastActive = nextActive
          setActive(nextActive)
        }

        // Логотип собран (assembly→1) у экрана-героя и у контактов, распадается
        // между ними — то же треугольное окно, что и у кроссфейда видео, только
        // для двух опорных точек (0 и последняя панель) вместо одной.
        const heroWindow = Math.max(0, 1 - Math.abs(raw - 0))
        const contactWindow = Math.max(0, 1 - Math.abs(raw - (total - 1)))
        logoScrollState.assembly = Math.max(heroWindow, contactWindow)

        const nextVariant: LogoVariant = heroWindow > 0.05 ? "hero" : contactWindow > 0.05 ? "contact" : "hidden"
        logoScrollState.variant = nextVariant
        if (nextVariant !== lastVariant) {
          lastVariant = nextVariant
          setLogoVariant(nextVariant)
        }
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
  }, [panels.length])

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

  return (
    <div ref={wrapRef} style={{ height: `${panels.length * 100}svh` }} className="relative">
      {panels.map(
        (p, i) =>
          p.anchorId && (
            <div
              key={`anchor-${p.anchorId}`}
              id={p.anchorId}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0"
              style={{ top: `${i * 100}svh`, height: "100svh" }}
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
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-background">
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

        <PersistentLogo variant={logoVariant} />

        {panels.map((p, i) => {
          const isActive = i === active
          const isNear = Math.abs(i - active) <= 1
          return (
            <div
              key={`fg-${p.id}`}
              ref={(el) => {
                contentRefs.current[i] = el
              }}
              className="absolute inset-0 z-10"
              style={{ opacity: i === 0 ? 1 : 0 }}
              aria-hidden={!isActive}
            >
              <div className="relative h-full w-full">{p.content({ isActive, isNear })}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
