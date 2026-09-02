import * as THREE from "three";
import { detectCapabilities, computeDrawingBufferSize, type Tier } from "../../core/capabilities";
import { SceneLifecycle, type SceneDisposer } from "../../core/scene-lifecycle";
import { showSceneFallback } from "../../core/scene-fallback";
import { FrameTimeMonitor } from "../../core/adaptive-quality";
import { ParticleSystem, WORLD_SCALE, FIXED_DT } from "./particle-system";
import { wantsCaptureHook, wantsDebugPanel } from "../../core/scene-capture";

interface TierConfig {
  gridSize: number;
  octaves: number;
  textureType: THREE.TextureDataType;
}

const TIER_A: TierConfig = { gridSize: 1024, octaves: 3, textureType: THREE.FloatType };
const TIER_B: TierConfig = { gridSize: 512, octaves: 2, textureType: THREE.HalfFloatType };

function configForTier(tier: Tier): TierConfig {
  return tier === "A" ? TIER_A : TIER_B;
}

export function initParticlesScene(root: HTMLElement): SceneDisposer {
  const canvas = root.querySelector<HTMLCanvasElement>(".scene-canvas");
  if (!canvas) return () => {};

  const capabilities = detectCapabilities(canvas);

  if (capabilities.tier === "C" || !capabilities.gl) {
    showSceneFallback(root);
    return () => {};
  }

  root.classList.add("is-active");

  const config = configForTier(capabilities.tier);
  const gl = capabilities.gl;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: gl,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x05060a, 1);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 20);
  camera.position.set(0, 0, 4.2);

  const scene = new THREE.Scene();
  let particleSystem = new ParticleSystem({
    renderer,
    gridSize: config.gridSize,
    octaves: config.octaves,
    textureType: config.textureType,
  });
  scene.add(particleSystem.points);

  const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pointerHit = new THREE.Vector3();

  function resize(): void {
    const rect = root.getBoundingClientRect();
    const { width } = computeDrawingBufferSize(rect.width, rect.height);
    // width уже учитывает и клампинг DPR, и общий бюджет пикселей drawing buffer —
    // эффективный pixelRatio получаем обратным делением на CSS-размер.
    const effectiveDpr = width / Math.max(rect.width, 1);
    renderer.setPixelRatio(effectiveDpr);
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);

  function updatePointer(clientX: number, clientY: number): void {
    const rect = canvas!.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(pointerPlane, pointerHit)) {
      particleSystem.pointer.copy(pointerHit).divideScalar(WORLD_SCALE);
    }
  }

  function onPointerMove(event: PointerEvent): void {
    updatePointer(event.clientX, event.clientY);
    particleSystem.pointerActive = true;
    lifecycle.requestRender();
  }

  function onPointerLeave(): void {
    particleSystem.pointerActive = false;
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);

  const frameMonitor = new FrameTimeMonitor();
  let gridDowngraded = false;
  let octavesDowngraded = false;

  const search = typeof window !== "undefined" ? window.location.search : "";
  // В режиме захвата симуляцию продвигает исключительно scripts/capture.ts
  // через window.__sceneCapture — обычный RAF-луп молчит, иначе шаги дублировались бы
  // недетерминированным реальным временем поверх ручных вызовов.
  const captureMode = wantsCaptureHook(search);

  const lifecycle: SceneLifecycle = new SceneLifecycle(canvas, {
    onFrame(deltaSeconds, elapsedSeconds) {
      if (captureMode) return;

      particleSystem.step(deltaSeconds);
      renderer.render(scene, camera);

      frameMonitor.push(deltaSeconds);
      if (frameMonitor.shouldDowngrade(elapsedSeconds)) {
        if (!gridDowngraded && capabilities.tier === "A") {
          particleSystem.downgradeGridSize(TIER_B.gridSize);
          gridDowngraded = true;
        } else if (!octavesDowngraded) {
          particleSystem.downgradeOctaves(Math.max(1, particleSystem.currentOctaves - 1));
          octavesDowngraded = true;
        }
      }
    },
    onStaticFrame() {
      // prefers-reduced-motion: без непрерывного RAF, но ручное взаимодействие
      // должно быть видно — делаем один шаг симуляции на каждый такой вызов.
      particleSystem.step(FIXED_DT);
      renderer.render(scene, camera);
    },
    onContextLost() {
      // Рендер уже остановлен SceneLifecycle. Ресурсы пересоздаются в onContextRestored,
      // так как WebGL2-контекст и все программы/текстуры становятся невалидны.
    },
    onContextRestored() {
      particleSystem.dispose();
      particleSystem = new ParticleSystem({
        renderer,
        gridSize: config.gridSize,
        octaves: config.octaves,
        textureType: config.textureType,
      });
      scene.clear();
      scene.add(particleSystem.points);
      gridDowngraded = false;
      octavesDowngraded = false;
    },
    onDispose() {
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      particleSystem.dispose();
      renderer.dispose();
    },
  });

  if (wantsDebugPanel(search)) {
    void import("./debug-panel").then(({ mountParticlesDebugPanel }) => {
      mountParticlesDebugPanel(root, particleSystem);
    });
  }

  if (captureMode) {
    window.__sceneCapture = {
      advanceFrame(dtSeconds) {
        particleSystem.step(dtSeconds);
      },
      render() {
        renderer.render(scene, camera);
      },
    };
  }

  return () => lifecycle.dispose();
}
