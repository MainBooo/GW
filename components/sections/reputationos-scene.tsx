"use client"

import { useRef } from "react"
import Image from "next/image"
import { usePanel } from "@/lib/panel-context"
import { useSceneTrack } from "@/lib/use-scene-track"
import { reputationOsScreens } from "@/lib/content"

const STAGES = [
  { title: "COLLECT", text: "Собирает отзывы и упоминания" },
  { title: "ANALYZE", text: "Определяет рейтинг, динамику и тональность" },
  { title: "RESPOND", text: "Готовит AI-черновики ответов" },
  { title: "CONTROL", text: "Показывает состояние репутации в одном интерфейсе" },
]

const THRESHOLDS = [0.08, 0.3, 0.52, 0.72]

const SHOTS = [
  { ...reputationOsScreens[0], pos: "left-[2%] top-[10%] w-[70%]", rot: "rotateY(-7deg) rotateX(2deg)", z: 20 },
  { ...reputationOsScreens[1], pos: "right-[4%] bottom-[8%] w-[56%]", rot: "rotateY(6deg) rotateX(-2deg)", z: 15 },
]

export function ReputationOsScene() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const stageRefs = useRef<(HTMLDivElement | null)[]>([])
  const shotsRef = useRef<HTMLDivElement>(null)
  const { openPanel } = usePanel()

  useSceneTrack(sectionRef, {
    steps: ["screen", "layers-shatter", "layers-assembled"],
    start: "top top",
    end: "bottom bottom",
    onUpdate: (progress) => {
      if (headingRef.current) {
        const t = Math.min(1, progress * 6)
        headingRef.current.style.opacity = String(t)
      }
      stageRefs.current.forEach((el, i) => {
        if (!el) return
        const th = THRESHOLDS[i]
        const t = Math.max(0, Math.min(1, (progress - th) / 0.16))
        el.style.opacity = String(t)
        el.style.transform = `translate3d(0, ${(1 - t) * 14}px, 0)`
      })
      if (shotsRef.current) {
        const t = Math.max(0, Math.min(1, (progress - 0.7) / 0.3))
        shotsRef.current.style.opacity = String(t)
        shotsRef.current.style.transform = `translate3d(0, ${(1 - t) * 26}px, 0)`
      }
    },
  })

  return (
    <section ref={sectionRef} id="reputationos" className="relative scroll-mt-[94px]" style={{ height: "280vh" }}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden pt-[94px] sm:pt-0">
        <div ref={headingRef} className="container-shell relative z-10 max-w-2xl text-center opacity-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent/70">Кейс · SaaS-платформа</div>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">REPUTATIONOS</h2>
          <p className="mx-auto mt-5 text-[16px] leading-7 text-white/65">
            Платформа мониторинга отзывов и упоминаний с единым inbox, аналитикой, уведомлениями и
            AI-черновиками ответов.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
            {STAGES.map((stage, i) => (
              <div
                key={stage.title}
                ref={(el) => {
                  stageRefs.current[i] = el
                }}
                className="rounded-2xl border border-white/10 bg-background/55 p-3 opacity-0 backdrop-blur-sm"
              >
                <div className="font-mono text-[10px] text-accent/80">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-1 text-sm font-semibold text-white">{stage.title}</div>
                <p className="mt-1 text-[11px] leading-4 text-white/68 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">{stage.text}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openPanel("reputationos")}
            data-cursor-el
            className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/10 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-accent/15"
          >
            Открыть кейс
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div
          ref={shotsRef}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[46vh] opacity-0 sm:h-[52vh]"
        >
          <div className="container-shell relative mx-auto h-full max-w-4xl">
            {SHOTS.map((shot) => (
              <div
                key={shot.src}
                className={`absolute overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f1f]/80 shadow-glow-lg backdrop-blur ${shot.pos}`}
                style={{ zIndex: shot.z, transform: `perspective(1800px) ${shot.rot}` }}
              >
                <Image src={shot.src} alt={`ReputationOS — ${shot.label}`} width={1600} height={900} className="w-full object-cover object-top" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
