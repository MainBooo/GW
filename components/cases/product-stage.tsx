"use client"

import { Suspense, useMemo, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { MeshReflectorMaterial, RoundedBox, useTexture } from "@react-three/drei"
import * as THREE from "three"

/**
 * Киношная витрина продукта: реальный интерфейс на экране ноутбука,
 * тёмная сцена, контровой свет и отражающий пол.
 *
 * Геометрия ноутбука строится процедурно, а не грузится моделью. Для корпуса
 * из двух скруглённых коробок и плоского экрана внешний .glb дал бы лишний
 * запрос и мегабайты ради того, что описывается двумя примитивами; заодно
 * исключается самая частая поломка импорта — поехавшая UV-развёртка экрана.
 * Если позже появится детальная модель, подменяется только <Laptop />.
 */

/** Реальные пропорции 14-дюймового ноутбука, метры. */
const BODY = { w: 0.31, h: 0.015, d: 0.215 }
const LID = { w: 0.31, h: 0.205, d: 0.008 }
/** Угол раскрытия крышки от вертикали. */
const LID_TILT = 0.28
/** Поле экрана внутри крышки: рамка примерно 6 мм. */
const SCREEN = { w: 0.298, h: 0.168 }

function Laptop({ screenshot }: { screenshot: string }) {
  const texture = useTexture(screenshot)

  useMemo(() => {
    // Скриншот интерфейса — sRGB. Без явного указания цветового
    // пространства картинка на экране выходит блёклой.
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
  }, [texture])

  return (
    <group position={[0, 0, 0]}>
      {/* Основание */}
      <RoundedBox
        args={[BODY.w, BODY.h, BODY.d]}
        radius={0.004}
        smoothness={4}
        position={[0, BODY.h / 2, 0]}
        castShadow
      >
        <meshStandardMaterial color="#15171d" metalness={0.85} roughness={0.32} />
      </RoundedBox>

      {/* Углубление под клавиатуру — только намёк, отдельные клавиши не нужны */}
      <mesh position={[0, BODY.h + 0.0002, 0.012]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BODY.w * 0.78, BODY.d * 0.5]} />
        <meshStandardMaterial color="#0c0e12" metalness={0.6} roughness={0.6} />
      </mesh>

      {/* Крышка с экраном: поворот вокруг задней кромки основания */}
      <group position={[0, BODY.h, -BODY.d / 2]} rotation={[-LID_TILT, 0, 0]}>
        <RoundedBox
          args={[LID.w, LID.h, LID.d]}
          radius={0.004}
          smoothness={4}
          position={[0, LID.h / 2, -LID.d / 2]}
          castShadow
        >
          <meshStandardMaterial color="#15171d" metalness={0.85} roughness={0.32} />
        </RoundedBox>

        {/*
          Экран — отдельная плоскость строго 16:9 под реальные скриншоты
          интерфейса (1672×941). Лёгкая эмиссия даёт свечение работающего
          дисплея, не засвечивая сцену.
        */}
        <mesh position={[0, LID.h / 2, 0.0005]}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          <meshStandardMaterial
            map={texture}
            emissiveMap={texture}
            emissive="#ffffff"
            emissiveIntensity={0.55}
            roughness={0.25}
            metalness={0}
          />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Вертикальный световой столб за объектом — опорный элемент кадра.
 * Прозрачность гасится к краям шейдером: плоскость с ровной заливкой читается
 * как прямоугольник интерфейса, а не как свет.
 */
function LightColumn({ color }: { color: string }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color(color) } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying vec2 vUv;
          void main() {
            // По горизонтали — мягкое ядро, по вертикали — затухание к обоим концам,
            // сильнее к верху: столб должен таять, а не обрываться краем плоскости.
            float x = 1.0 - smoothstep(0.0, 0.5, abs(vUv.x - 0.5));
            float core = pow(x, 2.2);
            float bottom = smoothstep(0.0, 0.28, vUv.y);
            float top = 1.0 - smoothstep(0.18, 0.72, vUv.y);
            gl_FragColor = vec4(uColor, core * bottom * top * 0.85);
          }
        `,
      }),
    [color],
  )

  return <mesh position={[0, 0.24, -0.5]} material={material}>
    <planeGeometry args={[0.46, 0.66]} />
  </mesh>
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[8, 8]} />
      <MeshReflectorMaterial
        blur={[420, 160]}
        resolution={1024}
        mixBlur={1.4}
        mixStrength={14}
        roughness={0.92}
        depthScale={1.4}
        minDepthThreshold={0.2}
        maxDepthThreshold={1.6}
        color="#080910"
        metalness={0.5}
        mirror={0}
      />
    </mesh>
  )
}

function Rig({ enabled }: { enabled: boolean }) {
  const { camera, pointer } = useThree()
  const target = useRef(new THREE.Vector3(0, 0.135, 0))

  useFrame((_, delta) => {
    if (!enabled) return
    // Мягкий парallax за курсором: камера не должна дёргаться,
    // поэтому позиция догоняется, а не назначается напрямую.
    const x = pointer.x * 0.1
    const y = 0.17 + pointer.y * 0.045
    camera.position.x += (x - camera.position.x) * Math.min(1, delta * 2.2)
    camera.position.y += (y - camera.position.y) * Math.min(1, delta * 2.2)
    camera.lookAt(target.current)
  })

  return null
}

export interface ProductStageProps {
  screenshot: string
  /** Акцент светового столба и контрового света. */
  accent?: string
  className?: string
}

export function ProductStage({ screenshot, accent = "#806BFF", className }: ProductStageProps) {
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  return (
    <div className={className}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ fov: 30, position: [0, 0.17, 0.58] }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.15
          scene.background = new THREE.Color("#07080c")
        }}
      >
        <fog attach="fog" args={["#07080c", 1.1, 3.4]} />

        <ambientLight intensity={0.12} />
        {/* Контровой — главный источник силуэта, как в киношной подаче продукта */}
        <pointLight position={[0, 0.55, -0.75]} intensity={7} color={accent} distance={3} decay={2} />
        {/* Мягкий заполняющий спереди-сверху, чтобы корпус не проваливался в чёрное */}
        <directionalLight position={[0.6, 1.1, 0.9]} intensity={0.8} color="#cfd6ff" castShadow />
        <spotLight position={[-0.8, 0.9, 0.5]} angle={0.6} penumbra={1} intensity={2.2} color="#29A9FF" />

        <Suspense fallback={null}>
          <Laptop screenshot={screenshot} />
          <Floor />
        </Suspense>

        <LightColumn color={accent} />
        <Rig enabled={!reduced} />
      </Canvas>
    </div>
  )
}
