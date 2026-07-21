"use client"

import { useRef, useState } from "react"
import { useSceneTrack } from "@/lib/use-scene-track"

const STAGES = [
  { title: "DISCOVERY", text: "Вокруг ядра появляются цели, ограничения и пользовательские сценарии." },
  { title: "ARCHITECTURE", text: "Прорисовываются frontend, backend, база данных, очереди, AI и интеграции." },
  { title: "BUILD", text: "Модули соединяются в рабочую систему." },
  { title: "LAUNCH", text: "Система активируется, интерфейс загорается." },
]

const THRESHOLDS = [0, 0.28, 0.56, 0.82]

export function ProcessScene() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const stageRefs = useRef<(HTMLDivElement | null)[]>([])
  const [online, setOnline] = useState(false)

  useSceneTrack(sectionRef, {
    steps: ["network", "architecture"],
    start: "top top",
    end: "bottom bottom",
    onUpdate: (progress) => {
      stageRefs.current.forEach((el, i) => {
        if (!el) return
        const th = THRESHOLDS[i]
        const nextTh = THRESHOLDS[i + 1] ?? 1
        const t = Math.max(0, Math.min(1, (progress - th) / Math.max(0.01, nextTh - th)))
        const isActive = progress >= th && progress < nextTh + 0.001
        el.style.opacity = isActive || (i === 3 && progress >= th) ? "1" : String(Math.max(0.25, t))
        el.style.transform = `translate3d(0, ${(1 - Math.min(1, t + 0.3)) * 10}px, 0)`
      })
      setOnline(progress > 0.94)
    },
  })

  return (
    <section ref={sectionRef} id="process" className="relative" style={{ height: "260vh" }}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        <div className="container-shell relative z-10 mx-auto max-w-3xl text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-secondary/70">Процесс разработки</div>

          <div className="mt-8 grid grid-cols-2 gap-4 text-left sm:grid-cols-4">
            {STAGES.map((stage, i) => (
              <div
                key={stage.title}
                ref={(el) => {
                  stageRefs.current[i] = el
                }}
                className="rounded-2xl border border-white/10 bg-background/40 p-4 backdrop-blur-sm transition-opacity"
                style={{ opacity: i === 0 ? 1 : 0.25 }}
              >
                <div className="font-mono text-xs text-white/35">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 text-sm font-semibold tracking-wide text-white">{stage.title}</div>
                <p className="mt-1.5 text-[12px] leading-5 text-white/55">{stage.text}</p>
              </div>
            ))}
          </div>

          <div
            className={`mx-auto mt-9 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-mono text-xs uppercase tracking-[0.3em] transition-all duration-500 ${
              online
                ? "border-accent/40 bg-accent/10 text-accent shadow-[0_0_24px_rgba(51,230,195,0.35)]"
                : "border-white/10 bg-white/[0.03] text-white/35"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-accent" : "bg-white/30"}`} />
            {online ? "SYSTEM ONLINE" : "SYSTEM INITIALIZING"}
          </div>
        </div>
      </div>
    </section>
  )
}
