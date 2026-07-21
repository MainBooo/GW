"use client"

import { useRef } from "react"
import Image from "next/image"
import { usePanel } from "@/lib/panel-context"
import { useIsMobile } from "@/lib/use-media-query"
import { useSceneTrack } from "@/lib/use-scene-track"
import { growthEngineScreens } from "@/lib/content"

const PANELS = [
  { ...growthEngineScreens[0], rot: "rotateY(-8deg) rotateX(3deg)", pos: "left-[4%] top-[16%] w-[62%] sm:w-[56%]", z: 30 },
  { ...growthEngineScreens[3], rot: "rotateY(6deg) rotateX(-2deg)", pos: "right-[2%] top-[6%] w-[46%] sm:w-[42%]", z: 20 },
  { ...growthEngineScreens[2], rot: "rotateY(-5deg) rotateX(2deg)", pos: "left-[18%] bottom-[6%] w-[48%] sm:w-[42%]", z: 15 },
  { ...growthEngineScreens[4], rot: "rotateY(7deg) rotateX(-3deg)", pos: "right-[8%] bottom-[2%] w-[40%] sm:w-[36%]", z: 10 },
]

export function GrowthEngineScene() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const { openPanel } = usePanel()

  useSceneTrack(sectionRef, {
    steps: ["network", "pipeline-0", "pipeline-1", "pipeline-2", "pipeline-3", "pipeline-4", "pipeline-5", "pipeline-6", "screen"],
    start: "top top",
    end: "bottom bottom",
    onUpdate: (progress) => {
      if (introRef.current) {
        const t = Math.min(1, progress * 9)
        introRef.current.style.opacity = String(Math.max(0, 1 - t))
        introRef.current.style.transform = `translate3d(0, ${t * -20}px, 0)`
      }
      if (revealRef.current) {
        // 8 equal WebGL segments (network -> 6 nodes -> screen) means the "screen"
        // shape lands at 7/8 = 0.875 of progress; start the DOM reveal right there.
        const t = Math.max(0, Math.min(1, (progress - 0.875) / 0.1))
        revealRef.current.style.opacity = String(t)
        revealRef.current.style.transform = `translate3d(0, ${(1 - t) * 30}px, 0) scale(${0.96 + t * 0.04})`
        revealRef.current.style.pointerEvents = t > 0.5 ? "auto" : "none"
      }
    },
  })

  return (
    <section
      ref={sectionRef}
      id="growth-engine"
      className="relative"
      style={{ height: isMobile ? "340vh" : "560vh" }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div ref={introRef} className="container-shell relative z-10 mx-auto max-w-2xl text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary/70">Кейс · AI-агенты</div>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">GROWTH ENGINE</h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-7 text-white/65">
            Мультиагентная система, которая планирует поиск, собирает компании, исследует их, оценивает
            соответствие предложению и находит контакты.
          </p>
        </div>

        <div
          ref={revealRef}
          className="container-shell absolute inset-0 z-10 flex flex-col items-center justify-center opacity-0"
          style={{ pointerEvents: "none" }}
        >
          <div className="relative h-[300px] w-full max-w-[880px] sm:h-[420px] lg:h-[480px]">
            {PANELS.map((panel) => (
              <div
                key={panel.src}
                className={`absolute overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f1f]/80 shadow-glow-lg backdrop-blur ${panel.pos}`}
                style={{
                  zIndex: panel.z,
                  transform: `perspective(1800px) ${panel.rot}`,
                  transformStyle: "preserve-3d",
                }}
              >
                <Image
                  src={panel.src}
                  alt={`Growth Engine — ${panel.label}`}
                  width={1600}
                  height={1000}
                  className="w-full object-cover object-top"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-white/70">
                  {panel.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => openPanel("growth-engine")}
              data-cursor-el
              className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary to-secondary px-6 py-3.5 text-sm font-medium text-white shadow-soft transition hover:scale-[1.02]"
            >
              Открыть кейс
            </button>
            <button
              type="button"
              onClick={() => openPanel("growth-engine")}
              data-cursor-el
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3.5 text-sm font-medium text-white/85 backdrop-blur-sm transition hover:bg-white/10"
            >
              Посмотреть интерфейс
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
