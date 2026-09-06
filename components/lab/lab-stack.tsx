"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Canvas } from "@react-three/fiber"
import { labScrollState } from "@/lib/lab-scroll-state"
import { useIsMobile } from "@/lib/use-media-query"
import { IdentityChapter } from "@/components/lab/chapters/identity-chapter"
import { LaptopChapter } from "@/components/lab/chapters/laptop-chapter"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export interface LabChapterCopy {
  id: string
  eyebrow: string
  title: string
  text: string
  note?: string
}

const CHAPTERS: LabChapterCopy[] = [
  {
    id: "identity",
    eyebrow: "01 · IDENTITY IN MOTION",
    title: "Фирменный знак становится самостоятельным цифровым объектом",
    text: "Логотип GenerationWeb собирается из узлов и рёбер, реагирует на курсор и меняет ракурс — интерактивные логотипы и hero-сцены для брендов.",
  },
  {
    id: "laptop",
    eyebrow: "02 · CINEMATIC PRODUCT DEVICE",
    title: "Устройство раскрывается, показывает интерфейс и разбирается на части",
    text: "Оригинальная модель ноутбука, собранная в Blender, целиком управляется прокруткой — открытие, интерфейс продукта, exploded view и обратная сборка.",
    note: "Модель и сцена — технологическая демонстрация, не рендер конкретного устройства.",
  },
]

/**
 * Ход прокрутки на главу. Mobile короче десктопа, но не настолько, чтобы
 * раскадровка ноутбука (открытие → интерфейс → exploded view → сборка)
 * скомкалась: при 190svh на главу приходилось меньше 1.5 экрана, и открытие
 * крышки пролетало почти мгновенно.
 */
function chapterHeightSvh(isMobile: boolean) {
  return isMobile ? 260 : 300
}

export function LabStack() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [chapter, setChapter] = useState(0)
  const [inViewport, setInViewport] = useState(true)
  const [modelError, setModelError] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || reducedMotion) return
    const total = CHAPTERS.length
    let lastChapter = -1

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: wrap,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const raw = self.progress * total
          const idx = Math.min(total - 1, Math.floor(raw))
          const local = Math.min(1, raw - idx)
          labScrollState.chapter = idx
          labScrollState.local = local
          if (idx !== lastChapter) {
            lastChapter = idx
            setChapter(idx)
          }
        },
      })

      // Высота обёртки зависит от isMobile, а он определяется только после
      // монтирования: секция ужимается уже ПОСЛЕ того, как ScrollTrigger снял
      // размеры. Сам он на изменение размеров элемента не реагирует, поэтому
      // end оставался посчитанным по прежней (десктопной) высоте — прогресс на
      // мобильном упирался в 0.56 вместо 1, вторая глава получала local не
      // больше 0.12, и крышка ноутбука (открытие с 0.15) не успевала
      // открыться вообще. Следим за реальной высотой и пересчитываем.
      const observer = new ResizeObserver(() => ScrollTrigger.refresh())
      observer.observe(wrap)

      return () => {
        observer.disconnect()
        st.kill()
      }
    }, wrap)

    return () => ctx.revert()
  }, [reducedMotion, isMobile])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const observer = new IntersectionObserver(([entry]) => setInViewport(entry.isIntersecting), { threshold: 0 })
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setInViewport(false)
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  // reduced-motion: собранный логотип, ноутбук открыт с ReputationOS на
  // экране, без автозапуска сборки/exploded view и без длинного pinning.
  if (reducedMotion) {
    labScrollState.chapter = 0
    labScrollState.local = 0.4
    return (
      <div className="container-shell grid gap-8 py-16 md:grid-cols-2 md:gap-6">
        {CHAPTERS.map((c) => (
          <div key={c.id} className="glass-cinema rounded-[24px] px-6 py-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-sand/80">{c.eyebrow}</p>
            <h2 className="mt-3 text-xl font-medium text-cream">{c.title}</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-stone">{c.text}</p>
          </div>
        ))}
        <p className="text-[12px] text-stone/60 md:col-span-2">
          Анимация отключена (настройка «меньше движения» в системе). Ниже — статичное описание обеих сцен.
        </p>
      </div>
    )
  }

  const height = chapterHeightSvh(isMobile)

  return (
    <div ref={wrapRef} className="relative" style={{ height: `${CHAPTERS.length * height}svh` }}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-background">
        <div className="absolute inset-0">
          <Canvas
            dpr={isMobile ? [1, 1.25] : [1, 1.5]}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            camera={{ fov: 32, position: [0, 0.2, 0.6] }}
            frameloop={inViewport ? "always" : "never"}
            onCreated={({ scene }) => {
              scene.background = null
            }}
          >
            <color attach="background" args={["#06070d"]} />
            <ambientLight intensity={0.6} color="#4a4f66" />
            <directionalLight position={[-1.4, 1.6, 1.2]} intensity={1.2} color="#cfd6ff" />
            <directionalLight position={[1.2, 0.6, -1]} intensity={0.6} color="#f2ecdd" />
            {/* Мягкий фронтальный fill близко к камере — без него объекты с тёмным
                матовым/металлическим материалом (нет environment-карты) уходят в
                тень почти на любом ракурсе, особенно на фоне #06070d. */}
            <directionalLight position={[0, 0.3, 0.7]} intensity={0.35} color="#e8e2d4" />

            {chapter === 0 && <IdentityChapter interactive={!isMobile} active={chapter === 0} />}
            {chapter === 1 && (
              <Suspense fallback={null}>
                <LaptopChapter onError={setModelError} />
              </Suspense>
            )}
          </Canvas>
        </div>

        {modelError && chapter === 1 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90">
            <p className="max-w-sm text-center text-sm text-stone">{modelError}</p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/55" />

        <div className="container-shell pointer-events-none relative z-10 flex h-full items-end pb-20 pt-24 sm:pb-24">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-sand/80">{CHAPTERS[chapter].eyebrow}</p>
            <h2 className="mt-4 text-balance text-2xl font-light leading-[1.2] text-cream sm:text-3xl">
              {CHAPTERS[chapter].title}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-stone">{CHAPTERS[chapter].text}</p>
            {CHAPTERS[chapter].note && <p className="mt-2 text-[12px] text-stone/55">{CHAPTERS[chapter].note}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
