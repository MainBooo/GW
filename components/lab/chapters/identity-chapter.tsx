"use client"

import { useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { NODES, EDGES, MATERIAL_PROPS, SCATTER, SCATTER_ROTATION, easeInOutCubic, type NodeId } from "@/lib/logo-geometry"
import { labScrollState } from "@/lib/lab-scroll-state"

/**
 * Глава 1 — Identity in Motion. Та же геометрия логотипа, что и на главной
 * (lib/logo-geometry.ts), но с собственной раскадровкой прогресса вместо
 * привязки к hero/contact:
 *   0.00–0.25  сборка
 *   0.25–0.55  собран, курсор двигает ракурс (интерактивная демонстрация)
 *   0.55–0.80  распад
 *   0.80–1.00  повторная сборка — глава заканчивается целой формой
 */
// На главной сцена почти всегда близка к assembly≈1 (полный разлёт виден
// только в невидимой fade-зоне между hero и контактами), поэтому базовая
// амплитуда SCATTER откалибрована сдержанно. Здесь распад — самостоятельная
// демонстрация, ему нужен явно читаемый размах.
const SCATTER_BOOST = 2.4

/** Аспект, под который выставлялся кадр (десктопный). */
const DESIGN_ASPECT = 1.6

function currentNodePos(id: NodeId, assembly: number, out: THREE.Vector3): THREE.Vector3 {
  const base = NODES[id].pos
  const scatter = SCATTER[id]
  const t = (1 - easeInOutCubic(assembly)) * SCATTER_BOOST
  out.set(base[0] + scatter[0] * t, base[1] + scatter[1] * t, base[2] + scatter[2] * t)
  return out
}

function assemblyFromLocal(local: number): number {
  if (local < 0.25) return local / 0.25
  if (local < 0.55) return 1
  if (local < 0.8) return 1 - (local - 0.55) / 0.25
  return (local - 0.8) / 0.2
}

export function IdentityChapter({ interactive, active }: { interactive: boolean; active: boolean }) {
  const group = useRef<THREE.Group>(null)
  const nodeRefs = useRef<Partial<Record<NodeId, THREE.Mesh>>>({})
  const rodRefs = useRef<(THREE.Mesh | null)[]>([])
  const { pointer, camera, size } = useThree()
  const lookTarget = useMemo(() => new THREE.Vector3(0, 0.12, 0), [])

  /**
   * Камера общая для обеих глав, и раньше эта глава её не трогала — задавала
   * только lookAt. После возврата со второй главы кадр оставался ноутбучным.
   * Здесь своя опорная точка, отодвинутая под аспект по тому же правилу, что
   * и в главе с ноутбуком (fov вертикальный, на портрете по горизонтали
   * влезает меньше).
   */
  const cameraBase = useMemo(() => new THREE.Vector3(0, 0.2, 0.6), [])
  const camPos = useMemo(() => new THREE.Vector3(), [])
  const fitScale = useMemo(() => {
    const aspect = size.height > 0 ? size.width / size.height : DESIGN_ASPECT
    return Math.max(1, DESIGN_ASPECT / aspect)
  }, [size.width, size.height])

  const tmpA = useMemo(() => new THREE.Vector3(), [])
  const tmpB = useMemo(() => new THREE.Vector3(), [])
  const tmpDir = useMemo(() => new THREE.Vector3(), [])
  const tmpQuat = useMemo(() => new THREE.Quaternion(), [])
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const unitRod = useMemo(() => new THREE.CylinderGeometry(0.028, 0.028, 1, 12), [])

  useFrame((_, delta) => {
    if (!group.current) return

    const local = labScrollState.chapter === 0 ? labScrollState.local : 0
    const assembly = assemblyFromLocal(local)

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
      const thin = 0.35 + 0.65 * assembly
      rod.scale.set(thin, length, thin)
    })

    // Смена ракурса: медленный, полностью обратимый разворот, завязанный на
    // local (не на время) — при скролле вверх ракурс возвращается сам.
    const baseYaw = local * Math.PI * 0.5
    const cursorYaw = interactive && active ? pointer.x * 0.25 : 0
    const cursorPitch = interactive && active ? -pointer.y * 0.15 : 0
    group.current.rotation.y += (baseYaw + cursorYaw - group.current.rotation.y) * Math.min(1, delta * 3)
    group.current.rotation.x += (0.12 + cursorPitch - group.current.rotation.x) * Math.min(1, delta * 3)

    camPos.copy(cameraBase).sub(lookTarget).multiplyScalar(fitScale).add(lookTarget)
    camera.position.lerp(camPos, Math.min(1, delta * 4))
    camera.lookAt(lookTarget)
  })

  return (
    // Геометрия логотипа авторизована в масштабе SVG (единицы ~ ±1.3), а
    // общая камера главы откалибрована под метровый масштаб ноутбука —
    // приводим к тому же порядку величины единым множителем группы.
    <group ref={group} scale={0.075} position={[0, 0.12, 0]}>
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
            <sphereGeometry args={[r, 24, 24]} />
            <meshPhysicalMaterial {...props} metalness={0} clearcoatRoughness={0.4} />
          </mesh>
        )
      })}
    </group>
  )
}
