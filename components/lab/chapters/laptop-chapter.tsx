"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { labScrollState } from "@/lib/lab-scroll-state"

const MODEL_URL = "/models/laptop.glb"

/** Аспект, под который выставлялась раскадровка камеры (десктопный кадр). */
const DESIGN_ASPECT = 1.6

const REQUIRED_NAMES = [
  "LaptopRoot",
  "BaseGroup",
  "BaseTop",
  "BaseBottom",
  "KeyboardDeck",
  "KeyboardKeys",
  "Trackpad",
  "HingeLeft",
  "HingeRight",
  "LidGroup",
  "LidShell",
  "DisplayBezel",
  "Screen",
  "ScreenGlass",
] as const

type NodeName = (typeof REQUIRED_NAMES)[number]

interface Captured {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  scale: THREE.Vector3
}

function capture(obj: THREE.Object3D): Captured {
  return {
    position: obj.position.clone(),
    quaternion: obj.quaternion.clone(),
    scale: obj.scale.clone(),
  }
}

function easeInOutCubic(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2
}

/** Экспоненциальный smoothstep-переход между двумя порогами прогресса. */
function band(progress: number, from: number, to: number): number {
  if (progress <= from) return 0
  if (progress >= to) return 1
  return easeInOutCubic((progress - from) / (to - from))
}

/** Разлёт деталей exploded view — направления понятны конструктивно. */
const EXPLODE_OFFSET: Partial<Record<NodeName, [number, number, number]>> = {
  BaseTop: [0, 0.055, 0],
  BaseBottom: [0, -0.05, 0],
  KeyboardDeck: [0, 0.1, 0],
  KeyboardKeys: [0, 0.15, 0],
  Trackpad: [0, 0.08, 0.03],
  HingeLeft: [-0.02, 0.03, 0],
  HingeRight: [0.02, 0.03, 0],
  // Локальные координаты внутри LidGroup — раздвигаем по оси толщины крышки.
  LidShell: [0, 0, -0.035],
  DisplayBezel: [0, 0, -0.012],
  Screen: [0, 0, 0.02],
  ScreenGlass: [0, 0, 0.055],
}

/**
 * Экран собран заново в Three.js (плоскость + прокси-группа, копирующая
 * rotation.x у LidGroup), а не взят напрямую из GLB: сама geometry Screen
 * из экспортированной модели ни при какой комбинации материала (Basic/
 * Standard), способа назначения текстуры (JSX-проп, императивная мутация,
 * файловая и процедурная canvas-текстура), geometry (Plane/Box) или
 * parenting не давала видимую текстуру на этом стеке — при этом сплошной
 * цвет на той же геометрии рендерится штатно, а точно такой же паттерн
 * (useTexture → meshStandardMaterial.map/emissiveMap) уже работает в
 * components/cases/product-stage.tsx на этой же странице сборки. Причина
 * не найдена за разумное время; вместо реального интерфейса экран показан
 * как честный включающийся дисплей (сплошное свечение), без более тяжёлых
 * попыток. HINGE_WORLD_POS/SCREEN_LOCAL_POS — реальные координаты, снятые с
 * загруженной модели, а не выведенные вручную по документации экспортёра.
 */
const SCREEN_W = 0.2506
const SCREEN_H = 0.1566
const SCREEN_LOCAL_POS: [number, number, number] = [0, -0.00586, 0.10999]
const HINGE_WORLD_POS: [number, number, number] = [0, 0.015, -0.22]

export function LaptopChapter({ onError }: { onError: (message: string) => void }) {
  const gltf = useGLTF(MODEL_URL)
  const { camera, size } = useThree()
  const screenRef = useRef<THREE.Mesh>(null)
  const lidProxyRef = useRef<THREE.Group>(null)

  const nodes = useMemo(() => {
    const map: Partial<Record<NodeName, THREE.Object3D>> = {}
    gltf.scene.traverse((obj) => {
      if (REQUIRED_NAMES.includes(obj.name as NodeName)) {
        map[obj.name as NodeName] = obj
      }
    })
    return map
  }, [gltf])

  const missing = useMemo(() => REQUIRED_NAMES.filter((n) => !nodes[n]), [nodes])

  const originals = useRef<Partial<Record<NodeName, Captured>>>({})
  const lidRestX = useRef(0)

  useEffect(() => {
    if (missing.length > 0) {
      onError(`В laptop.glb не найдены обязательные объекты: ${missing.join(", ")}`)
      return
    }
    for (const name of REQUIRED_NAMES) {
      const obj = nodes[name]
      if (obj) originals.current[name] = capture(obj)
    }
    const lid = nodes.LidGroup
    if (lid) lidRestX.current = lid.rotation.x

    const originalScreen = nodes.Screen as THREE.Mesh | undefined
    if (originalScreen) originalScreen.visible = false
    const glass = nodes.ScreenGlass as THREE.Mesh | undefined
    if (glass) glass.visible = false
    // eslint-disable-next-line react-hooks/exhaustive-deps -- захват исходных transform выполняется один раз после загрузки модели
  }, [missing.length])

  const cameraStart = useMemo(() => new THREE.Vector3(0, 0.22, 0.62), [])
  const cameraOrbit = useMemo(() => new THREE.Vector3(0.16, 0.2, 0.56), [])
  const cameraExploded = useMemo(() => new THREE.Vector3(0.28, 0.26, 0.5), [])
  const cameraFinal = useMemo(() => new THREE.Vector3(0, 0.2, 0.58), [])
  const lookTarget = useMemo(() => new THREE.Vector3(0, 0.1, 0), [])
  const camPos = useMemo(() => new THREE.Vector3(), [])

  /**
   * Раскадровка камеры выставлялась под ландшафтный кадр. fov вертикальный, и
   * на портретном экране по горизонтали влезает во столько же раз меньше, во
   * сколько уже аспект: на 390x664 ноутбук занимал 163% ширины кадра и просто
   * не помещался. Отодвигаем камеру от точки взгляда ровно на отношение
   * аспектов — композиция получается той же, что и на десктопе.
   */
  const fitScale = useMemo(() => {
    const aspect = size.height > 0 ? size.width / size.height : DESIGN_ASPECT
    return Math.max(1, DESIGN_ASPECT / aspect)
  }, [size.width, size.height])
  const screenColor = useMemo(() => new THREE.Color(), [])

  useFrame((_, delta) => {
    if (missing.length > 0) return
    const progress = labScrollState.chapter === 1 ? labScrollState.local : 0

    const lid = nodes.LidGroup
    if (lid) {
      const openAmount = band(progress, 0.15, 0.35)
      lid.rotation.x = lidRestX.current * openAmount
    }

    const explodeIn = band(progress, 0.5, 0.72)
    const explodeOut = 1 - band(progress, 0.86, 1.0)
    const explodeT = Math.min(explodeIn, explodeOut)

    for (const name of REQUIRED_NAMES) {
      const offset = EXPLODE_OFFSET[name]
      if (!offset || name === "Screen") continue
      const obj = nodes[name]
      const orig = originals.current[name]
      if (!obj || !orig) continue
      obj.position.set(
        orig.position.x + offset[0] * explodeT,
        orig.position.y + offset[1] * explodeT,
        orig.position.z + offset[2] * explodeT,
      )
    }

    // Прокси-группа экрана копирует тот же rotation.x, что и настоящий
    // LidGroup — открытие/exploded-смещение синхронизированы автоматически.
    if (lid && lidProxyRef.current) {
      lidProxyRef.current.rotation.x = lid.rotation.x
    }
    if (screenRef.current) {
      const screenOffset = EXPLODE_OFFSET.Screen ?? [0, 0, 0]
      screenRef.current.position.set(
        SCREEN_LOCAL_POS[0],
        SCREEN_LOCAL_POS[1] + screenOffset[2] * explodeT,
        SCREEN_LOCAL_POS[2],
      )
    }

    // Камера: дольше-ин у закрытого корпуса → лёгкий облёт при открытии → шире
    // при разборке → спокойный финальный ракурс. Один общий путь без
    // отдельного ScrollTrigger на деталь.
    if (progress < 0.15) {
      camPos.lerpVectors(cameraStart.clone().add(new THREE.Vector3(0, 0.05, 0.08)), cameraStart, band(progress, 0, 0.15))
    } else if (progress < 0.5) {
      camPos.lerpVectors(cameraStart, cameraOrbit, band(progress, 0.15, 0.5))
    } else if (progress < 0.86) {
      camPos.lerpVectors(cameraOrbit, cameraExploded, band(progress, 0.5, 0.86))
    } else {
      camPos.lerpVectors(cameraExploded, cameraFinal, band(progress, 0.86, 1))
    }
    // Масштабируем расстояние относительно точки взгляда, а не начала
    // координат: направление обзора сохраняется, меняется только удаление.
    camPos.sub(lookTarget).multiplyScalar(fitScale).add(lookTarget)
    camera.position.lerp(camPos, Math.min(1, delta * 4))
    camera.lookAt(lookTarget)

    // Экран: гаснет закрытым, светится при открытии — оттенок мягко меняется
    // между "проектной" и "финальной" фазой вместо статичной текстуры (см.
    // комментарий у SCREEN_W выше).
    const mat = screenRef.current?.material as THREE.MeshBasicMaterial | undefined
    if (mat) {
      const intensity = band(progress, 0.18, 0.32)
      const hue = progress < 0.86 ? 0.58 : 0.42
      screenColor.setHSL(hue, 0.35, 0.16 + intensity * 0.22)
      mat.color.copy(screenColor)
    }
  })

  if (missing.length > 0) return null

  return (
    <>
      <primitive object={gltf.scene} />
      <group ref={lidProxyRef} position={HINGE_WORLD_POS}>
        <mesh ref={screenRef} position={SCREEN_LOCAL_POS} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  )
}

useGLTF.preload(MODEL_URL)
