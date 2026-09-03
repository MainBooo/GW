"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export interface CinematicPanel {
  id: string
  eyebrow: string
  heading: string
  sub: string
  /**
   * Цвет-подложка под видео: красится мгновенно, пока файл ещё не
   * прогрузился, и остаётся видимым по краям при letterbox на нетипичных
   * пропорциях экрана.
   */
  placeholderClass: string
  videoSrc?: string
  cta?: { label: string; onClick: () => void }
}

/**
 * Полноэкранный видео-скролл: N панелей внутри одного закреплённого
 * вьюпорта, кроссфейд между соседними держится на прогрессе скролла.
 * Тот же приём, что уже использует Hero/TechMapScene этого сайта
 * (растянутая обёртка + sticky top-0 h-screen) — только вместо камеры
 * 3D-сцены здесь меняется непрозрачность слоёв.
 */
export function PanelStack({ panels }: { panels: CinematicPanel[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const textRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const total = panels.length
    let lastActive = -1

    const st = ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const raw = self.progress * (total - 1)
        // Треугольное окно: слой i виден там, где raw ближе всего к i,
        // и линейно гаснет к соседям — простой и честный кроссфейд без
        // отдельной ветки на вход/выход.
        layerRefs.current.forEach((el, i) => {
          if (!el) return
          const opacity = Math.max(0, 1 - Math.abs(raw - i))
          el.style.opacity = String(opacity)
        })

        const nextActive = Math.max(0, Math.min(total - 1, Math.round(raw)))
        if (nextActive !== lastActive) {
          lastActive = nextActive
          setActive(nextActive)
        }
      },
    })

    return () => st.kill()
  }, [panels.length])

  useEffect(() => {
    if (!textRef.current) return
    gsap.fromTo(
      textRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
    )
  }, [active])

  const panel = panels[active]

  return (
    <div ref={wrapRef} style={{ height: `${panels.length * 100}vh` }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-background">
        {panels.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => {
              layerRefs.current[i] = el
            }}
            className={`absolute inset-0 ${p.placeholderClass}`}
            style={{ opacity: i === 0 ? 1 : 0 }}
            aria-hidden={i !== active}
          >
            {p.videoSrc && (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src={p.videoSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              />
            )}
            {/* Затемнение снизу — текст должен читаться на любом фоне */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
          </div>
        ))}

        <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-24 text-center sm:pb-32">
          <div ref={textRef} className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-white/60">{panel.eyebrow}</p>
            <h2 className="mt-4 text-balance text-3xl font-light leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {panel.heading}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/65">{panel.sub}</p>
            {panel.cta && (
              <button
                type="button"
                onClick={panel.cta.onClick}
                className="mt-8 rounded-full border border-white/25 bg-white/[0.06] px-7 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/[0.12]"
              >
                {panel.cta.label}
              </button>
            )}
          </div>

          <div className="mt-10 flex items-center gap-1.5" aria-hidden="true">
            {panels.map((p, i) => (
              <span
                key={p.id}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === active ? "w-6 bg-white/80" : "w-1.5 bg-white/25"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
