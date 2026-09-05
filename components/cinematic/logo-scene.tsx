"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { logoScrollState } from "@/lib/logo-scroll-state"
import { NODES, EDGES, MATERIAL_PROPS, SCATTER, SCATTER_ROTATION, easeInOutCubic, type NodeId } from "@/lib/logo-geometry"

/**
 * Отдельная от lib/device-tier.ts проверка: там prefers-reduced-motion сразу
 * означает tier "static" (сцена вообще не рисуется — верно для частиц). Для
 * логотипа спецификация другая — при reduced-motion форма остаётся видна в
 * собранном виде, просто без вращения и реакции на курсор; на flat SVG
 * откатываемся только при реальном отсутствии WebGL.
 */
type LogoTier = "full" | "lite" | "off"

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")))
  } catch {
    return false
  }
}

function detectLogoTier(): LogoTier {
  if (!hasWebGL()) return "off"

  const isCoarse = window.matchMedia("(pointer: coarse)").matches
  const isNarrow = window.matchMedia("(max-width: 768px)").matches
  const nav = navigator as Navigator & { deviceMemory?: number }
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return "off"

  if (isCoarse || isNarrow || (navigator.hardwareConcurrency ?? 4) <= 2) return "lite"
  return "full"
}

/** Текущая (собранная⇄разлетевшаяся) позиция узла — эталон не изменяется. */
function currentNodePos(id: NodeId, assembly: number, out: THREE.Vector3): THREE.Vector3 {
  const base = NODES[id].pos
  const scatter = SCATTER[id]
  const t = 1 - easeInOutCubic(assembly)
  out.set(base[0] + scatter[0] * t, base[1] + scatter[1] * t, base[2] + scatter[2] * t)
  return out
}

function RigContents({ segments }: { segments: number }) {
  const nodeRefs = useRef<Partial<Record<NodeId, THREE.Mesh>>>({})
  const rodRefs = useRef<(THREE.Mesh | null)[]>([])
  const tmpA = useMemo(() => new THREE.Vector3(), [])
  const tmpB = useMemo(() => new THREE.Vector3(), [])
  const tmpDir = useMemo(() => new THREE.Vector3(), [])
  const tmpQuat = useMemo(() => new THREE.Quaternion(), [])
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])

  const unitRod = useMemo(() => new THREE.CylinderGeometry(0.028, 0.028, 1, Math.max(6, Math.round(segments / 2))), [segments])

  // Сглаживание сборки: любое расхождение (первый тик скролла, refresh
  // ScrollTrigger, возврат из bfcache) доезжает за ~0.2 c, а не применяется
  // одним кадром. Толщина рёбер меняется втрое на всём диапазоне assembly,
  // поэтому мгновенный скачок здесь особенно заметен.
  const smoothedAssembly = useRef(logoScrollState.assembly)

  useFrame((_, delta) => {
    // delta ограничена по той же причине, что и в LogoRig: после паузы rAF
    // (скролл-жест на iOS, свёрнутая вкладка) сырой delta схлопывает
    // сглаживание в мгновенный скачок.
    smoothedAssembly.current += (logoScrollState.assembly - smoothedAssembly.current) * Math.min(1, Math.min(delta, 1 / 30) * 8)
    const assembly = smoothedAssembly.current
    for (const id of Object.keys(NODES) as NodeId[]) {
      const mesh = nodeRefs.current[id]
      if (!mesh) continue
      currentNodePos(id, assembly, mesh.position)
      const t = 1 - easeInOutCubic(assembly)
      const rot = SCATTER_ROTATION[id]
      mesh.rotation.set(rot[0] * t, rot[1] * t, rot[2] * t)
    }

    EDGES.forEach(([from, to], i) => {
      const rod = rodRefs.current[i]
      if (!rod) return
      currentNodePos(from, assembly, tmpA)
      currentNodePos(to, assembly, tmpB)
      tmpDir.subVectors(tmpB, tmpA)
      const length = tmpDir.length()
      rod.position.copy(tmpA).addScaledVector(tmpDir, 0.5)
      if (length > 1e-5) {
        tmpQuat.setFromUnitVectors(up, tmpDir.clone().normalize())
        rod.quaternion.copy(tmpQuat)
      }
      rod.scale.set(1, length, 1)
      // Рёбра истончаются при разлёте — читаются как разрыв связи, а не
      // как растянутая деталь.
      const thin = 0.35 + 0.65 * assembly
      rod.scale.x = thin
      rod.scale.z = thin
    })
  })

  return (
    <>
      {EDGES.map(([from, to], i) => (
        <mesh
          key={`${from}-${to}`}
          ref={(el) => {
            rodRefs.current[i] = el
          }}
          geometry={unitRod}
        >
          <meshPhysicalMaterial {...MATERIAL_PROPS.ceramic} metalness={0} clearcoatRoughness={0.4} />
        </mesh>
      ))}
      {(Object.keys(NODES) as NodeId[]).map((id) => {
        const { material, r } = NODES[id]
        const props = MATERIAL_PROPS[material]
        return (
          <mesh
            key={id}
            ref={(el) => {
              if (el) nodeRefs.current[id] = el
            }}
          >
            <sphereGeometry args={[r, segments, segments]} />
            <meshPhysicalMaterial {...props} metalness={0} clearcoatRoughness={0.4} />
          </mesh>
        )
      })}
    </>
  )
}

function LogoRig({ pointerFollow, reducedMotion, segments }: { pointerFollow: boolean; reducedMotion: boolean; segments: number }) {
  const group = useRef<THREE.Group>(null)
  const { pointer, invalidate } = useThree()

  useEffect(() => {
    if (reducedMotion && group.current) {
      // Фиксированный, заранее выверенный ракурс вместо "заморозки на
      // случайном кадре" — важно для prefers-reduced-motion и tier "lite".
      group.current.rotation.set(0.1, -0.3, 0)
      invalidate()
    }
  }, [reducedMotion, invalidate])

  useFrame((_, delta) => {
    // assembly постоянно читается извне (скролл) — кадр нужен всегда, пока
    // логотип потенциально виден, независимо от pointerFollow.
    if (!group.current || reducedMotion) return
    // Ограничение шага: после паузы rAF (скролл-жест на iOS, свёрнутая
    // вкладка) delta приходит огромной, и движение отработало бы скачком.
    const step = Math.min(delta, 1 / 30)
    if (!pointerFollow) {
      // Мобильный логотип в покое НЕ анимируется намеренно. Здесь он лежит
      // во весь экран позади карточки с backdrop-filter, а WebKit не
      // пересэмплирует размытый фон, пока страница неподвижна: под стеклом
      // остаётся устаревший снимок сцены. Любое собственное движение
      // логотипа поэтому копится незаметно, а первый же скролл обновляет
      // композицию — и логотип скачком «проявляется» сквозь блок. Пока
      // ничего не движется, устаревать нечему. Разлёт/сборка по скроллу
      // безопасны: во время прокрутки композиция обновляется постоянно.
      return
    }
    // Десктоп: логотип стоит сбоку от карточки, а не под ней, поэтому
    // непрерывное вращение и курсорный параллакс здесь безопасны.
    group.current.rotation.y += step * 0.045
    const targetX = 0.1 - pointer.y * 0.12
    const targetZ = pointer.x * 0.08
    group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, step * 2)
    group.current.rotation.z += (targetZ - group.current.rotation.z) * Math.min(1, step * 2)
  })

  return (
    <group ref={group} rotation={[0.1, -0.3, 0]}>
      <RigContents segments={segments} />
    </group>
  )
}

function FallbackLogo({ className }: { className?: string }) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Image src="/logo/generationweb.svg" alt="GenerationWeb" fill className="object-contain opacity-90" sizes="(min-width: 1024px) 480px, 60vw" />
    </div>
  )
}

export interface LogoSceneProps {
  className?: string
  /** Автовращение + курсорный параллакс (десктоп; на мобильном всегда выключено). */
  interactive?: boolean
  /** Сцена сейчас на экране — держим frameloop "always", иначе ставим на паузу. */
  visible?: boolean
}

/**
 * Лёгкая процедурная Three.js-сцена: один общий рендерер на страницу
 * (используется и как персистентный логотип главной, и повторно — как глава
 * "Identity in Motion" на /lab). Сборка/распад читаются из
 * lib/logo-scroll-state.ts, обновляемого извне по скроллу.
 */
export function LogoScene({ className, interactive = true, visible = true }: LogoSceneProps) {
  const [tier, setTier] = useState<LogoTier | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [tabHidden, setTabHidden] = useState(false)
  // WebGL-контекст и первая отрисовка занимают заметную долю секунды после
  // монтирования — без этого флага объект не проявляется, а "выскакивает"
  // уже полностью собранным поверх карточки, которая успела отрисоваться
  // раньше. Канвас держим на opacity:0 до первого кадра, затем плавно
  // проявляем через CSS-transition.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setTier(detectLogoTier())
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mql.addEventListener("change", onChange)

    const onVisibility = () => setTabHidden(document.hidden)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      mql.removeEventListener("change", onChange)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  // Без WebGL — обычный SVG-логотип сразу, без сломанной композиции. Пока
  // возможности ещё не определены (tier === null, обычно один тик после
  // гидратации) — ничего не рендерим: сам SVG цветной (совпадает с хедером),
  // тёмная 3D-версия — нет, и мелькание одного вместо другого на пару кадров
  // читается как ещё один резкий скачок, который мы и убираем.
  if (tier === null) {
    return <div className={className} />
  }
  if (tier === "off") {
    return <FallbackLogo className={className} />
  }

  const reducedSegments = tier === "lite" ? 12 : 24
  const dprCap: [number, number] = tier === "lite" ? [1, 1.2] : [1, 1.5]
  const shouldRender = visible && !tabHidden

  return (
    <div className={className}>
      <div className={`h-full w-full transition-opacity duration-700 ease-out ${ready ? "opacity-100" : "opacity-0"}`}>
        <Canvas
          dpr={dprCap}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          camera={{ fov: 40, position: [0, 0, 4.2] }}
          frameloop={shouldRender ? "always" : "never"}
          onCreated={() => {
            // Двойной rAF — контекст создан, но геометрия ещё не обязательно
            // попала в первый закоммиченный кадр; ждём кадр после кадра.
            requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
          }}
        >
          <ambientLight intensity={0.55} color="#4a4f66" />
          <directionalLight position={[-2.2, 1.6, -1.8]} intensity={1.4} color="#cfd6ff" />
          <directionalLight position={[1.6, 2, 2.6]} intensity={0.65} color="#f2ecdd" />
          <directionalLight position={[0, 0.4, 4]} intensity={0.4} color="#e8e2d4" />

          <Suspense fallback={null}>
            <LogoRig pointerFollow={interactive} reducedMotion={reducedMotion} segments={reducedSegments} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}
