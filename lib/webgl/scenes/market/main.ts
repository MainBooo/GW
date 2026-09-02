import * as THREE from "three";
import { detectCapabilities, computeDrawingBufferSize, type Tier } from "../../core/capabilities";
import { SceneLifecycle, type SceneDisposer } from "../../core/scene-lifecycle";
import { showSceneFallback } from "../../core/scene-fallback";
import { wantsCaptureHook, wantsDebugPanel } from "../../core/scene-capture";
import { buildMarketField, type MarketSnapshot } from "./market-data";
import { buildLandscape, candleToWorldX, worldXToCandle, TIME_STEP, type LandscapeGeometry } from "./landscape";
import snapshot from "../../data/market-btcusdt-1h.json";

const TIER_BUCKETS: Record<Exclude<Tier, "C">, number> = { A: 96, B: 64 };
const ATR_PERIOD = 20;
/** Пауза без ввода, после которой автополёт возобновляется. */
const AUTOFLY_RESUME_DELAY = 5;

interface MarketDebugParams {
  heightScale: number;
  buckets: number;
  glowStrength: number;
  cameraSpeed: number;
  visibleRange: number;
}

export function initMarketScene(root: HTMLElement): SceneDisposer {
  const canvas = root.querySelector<HTMLCanvasElement>(".scene-canvas");
  const tooltip = root.querySelector<HTMLElement>(".scene-tooltip");
  if (!canvas) return () => {};

  const capabilities = detectCapabilities(canvas);
  if (capabilities.tier === "C" || !capabilities.gl) {
    showSceneFallback(root);
    return () => {};
  }
  root.classList.add("is-active");

  const data = snapshot as MarketSnapshot;
  const candles = data.candles;

  const debug: MarketDebugParams = {
    heightScale: 1,
    buckets: TIER_BUCKETS[capabilities.tier],
    glowStrength: 0.8,
    cameraSpeed: 1,
    visibleRange: candles.length,
  };

  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: capabilities.gl,
    antialias: capabilities.tier === "A",
    alpha: false,
    powerPreference: "high-performance",
  });
  // Тонмаппинг и гамма — в шейдере, Three.js своего не добавляет.
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x05070c, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);

  let landscape: LandscapeGeometry = createLandscape(debug.buckets);
  scene.add(landscape.mesh, landscape.profileMesh);

  function createLandscape(buckets: number): LandscapeGeometry {
    const field = buildMarketField(candles, { buckets, atrPeriod: ATR_PERIOD });
    const built = buildLandscape(field);
    built.material.uniforms.uHeightScale.value = debug.heightScale;
    built.material.uniforms.uGlowStrength.value = debug.glowStrength;
    applyVisibleRange(built, debug.visibleRange);
    return built;
  }

  function applyVisibleRange(target: LandscapeGeometry, visibleCandles: number): void {
    const clamped = Math.min(Math.max(Math.round(visibleCandles), 2), candles.length);
    target.mesh.geometry.setDrawRange(0, clamped * target.indicesPerCandle);
  }

  function rebuildLandscape(): void {
    scene.remove(landscape.mesh, landscape.profileMesh);
    disposeLandscape(landscape);
    landscape = createLandscape(debug.buckets);
    scene.add(landscape.mesh, landscape.profileMesh);
  }

  function disposeLandscape(target: LandscapeGeometry): void {
    target.mesh.geometry.dispose();
    target.profileMesh.geometry.dispose();
    target.material.dispose();
  }

  function resize(): void {
    const rect = root.getBoundingClientRect();
    const { width } = computeDrawingBufferSize(rect.width, rect.height);
    renderer.setPixelRatio(width / Math.max(rect.width, 1));
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);

  // --- Камера: автополёт вдоль оси времени --------------------------------

  const flightStart = candleToWorldX(0, candles.length) - 4;
  const flightEnd = candleToWorldX(candles.length - 1, candles.length) + 4;
  let flightX = flightStart;
  let autoFlying = true;
  let idleSeconds = 0;

  /** Сглаженная Z ценовой траектории вокруг текущей позиции полёта. */
  function trackedZ(x: number): number {
    const centre = worldXToCandle(x, candles.length);
    const half = 24;
    let sum = 0;
    let weight = 0;
    for (let i = centre - half; i <= centre + half; i++) {
      if (i < 0 || i >= landscape.centroidZ.length) continue;
      // Треугольное окно: соседние свечи влияют слабее — камера не дёргается
      // на одиночных выбросах цены, но идёт за общим движением.
      const w = 1 - Math.abs(i - centre) / (half + 1);
      sum += landscape.centroidZ[i] * w;
      weight += w;
    }
    return weight > 0 ? sum / weight : 0;
  }

  let smoothedZ = 0;

  function updateCamera(dt: number): void {
    if (autoFlying) {
      flightX += dt * debug.cameraSpeed * 3.2;
      if (flightX > flightEnd) flightX = flightStart;
    } else {
      idleSeconds += dt;
      if (idleSeconds >= AUTOFLY_RESUME_DELAY) autoFlying = true;
    }

    // Лента данных занимает лишь узкую полосу ценового диапазона и дрейфует
    // по нему во времени, поэтому камера ведётся за ценой — иначе рельеф
    // быстро уходит из кадра и остаётся пустое пространство.
    const targetZ = trackedZ(flightX);
    smoothedZ = dt > 0 ? smoothedZ + (targetZ - smoothedZ) * Math.min(1, dt * 1.5) : targetZ;

    // Взгляд ведётся преимущественно вдоль оси времени: если смотреть поперёк,
    // узкая лента данных занимает лишь полоску кадра, а остальное — пустота.
    camera.position.set(flightX - 5, 2.2, smoothedZ + 4.6);
    camera.lookAt(flightX + 9, 0.55, smoothedZ + 0.5);

    // Профиль объёма агрегирован за весь период и от времени не зависит,
    // поэтому едет вместе с камерой — иначе был бы виден лишь в одной точке.
    landscape.profileMesh.position.x = flightX + 3;
  }

  function interrupt(): void {
    autoFlying = false;
    idleSeconds = 0;
  }

  // --- Наведение: индекс свечи через пересечение с плоскостью --------------

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPoint = new THREE.Vector3();

  /**
   * Индекс свечи считается обратным пересчётом мировой координаты X,
   * полученной пересечением луча с плоскостью. Перебора треугольников нет —
   * на 1.1 млн индексов он был бы неприемлемо дорогим.
   */
  function candleIndexAt(clientX: number, clientY: number): number | null {
    const rect = canvas!.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(groundPlane, hitPoint)) return null;

    const index = worldXToCandle(hitPoint.x, candles.length);
    if (index < 0 || index >= candles.length) return null;
    if (index >= debug.visibleRange) return null;
    if (Math.abs(hitPoint.z) > 8) return null;
    return index;
  }

  function formatTooltip(index: number): string {
    const [openTime, open, high, low, close, volume] = candles[index];
    const date = new Date(openTime).toISOString().replace("T", " ").slice(0, 16);
    const changePercent = ((close - open) / open) * 100;
    return [
      `${data.symbol} ${data.interval} · ${date} UTC`,
      `O ${open.toFixed(2)}  H ${high.toFixed(2)}`,
      `L ${low.toFixed(2)}  C ${close.toFixed(2)}`,
      `Δ ${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%  V ${volume.toFixed(1)}`,
    ].join("\n");
  }

  function showTooltip(index: number, clientX: number, clientY: number): void {
    if (!tooltip) return;
    const rect = root.getBoundingClientRect();
    tooltip.textContent = formatTooltip(index);
    tooltip.hidden = false;
    tooltip.style.left = `${clientX - rect.left}px`;
    tooltip.style.top = `${clientY - rect.top}px`;
  }

  function hideTooltip(): void {
    if (tooltip) tooltip.hidden = true;
  }

  let pinnedIndex: number | null = null;

  function onPointerMove(event: PointerEvent): void {
    interrupt();
    if (event.pointerType === "touch") return;
    const index = candleIndexAt(event.clientX, event.clientY);
    if (index === null) hideTooltip();
    else showTooltip(index, event.clientX, event.clientY);
    lifecycle.requestRender();
  }

  function onPointerDown(event: PointerEvent): void {
    interrupt();
    if (event.pointerType !== "touch") return;
    // На телефоне тап показывает подсказку, повторный тап убирает.
    const index = candleIndexAt(event.clientX, event.clientY);
    if (index === null || index === pinnedIndex) {
      pinnedIndex = null;
      hideTooltip();
    } else {
      pinnedIndex = index;
      showTooltip(index, event.clientX, event.clientY);
    }
    lifecycle.requestRender();
  }

  function onPointerLeave(): void {
    if (pinnedIndex === null) hideTooltip();
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("wheel", interrupt, { passive: true });

  const search = typeof window !== "undefined" ? window.location.search : "";
  const captureMode = wantsCaptureHook(search);

  function step(dt: number): void {
    updateCamera(dt);
  }

  const lifecycle: SceneLifecycle = new SceneLifecycle(canvas, {
    onFrame(deltaSeconds) {
      if (captureMode) return;
      step(deltaSeconds);
      renderer.render(scene, camera);
    },
    onStaticFrame() {
      // prefers-reduced-motion: автополёт не идёт, но кадр перерисовывается
      // на взаимодействие — подсказка и наведение остаются рабочими.
      renderer.render(scene, camera);
    },
    onContextLost() {
      // Геометрия и программа пересоздаются после восстановления контекста.
    },
    onContextRestored() {
      rebuildLandscape();
      resize();
    },
    onDispose() {
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", interrupt);
      disposeLandscape(landscape);
      renderer.dispose();
    },
  });

  // Первый кадр: камера должна встать до того, как сцена станет видимой.
  updateCamera(0);

  if (wantsDebugPanel(search)) {
    void import("../../core/debug-panel").then(({ mountDebugPanel }) => {
      mountDebugPanel(root, [
        {
          label: "Масштаб высоты",
          min: 0.1,
          max: 4,
          step: 0.05,
          get: () => debug.heightScale,
          set: (v) => {
            debug.heightScale = v;
            landscape.material.uniforms.uHeightScale.value = v;
          },
        },
        {
          label: "Число корзин",
          min: 16,
          max: 192,
          step: 8,
          get: () => debug.buckets,
          set: (v) => {
            debug.buckets = v;
            rebuildLandscape();
          },
        },
        {
          label: "Сила свечения",
          min: 0,
          max: 3,
          step: 0.05,
          get: () => debug.glowStrength,
          set: (v) => {
            debug.glowStrength = v;
            landscape.material.uniforms.uGlowStrength.value = v;
          },
        },
        {
          label: "Скорость камеры",
          min: 0,
          max: 4,
          step: 0.05,
          get: () => debug.cameraSpeed,
          set: (v) => {
            debug.cameraSpeed = v;
          },
        },
        {
          label: "Видимый диапазон",
          min: 50,
          max: candles.length,
          step: 50,
          get: () => debug.visibleRange,
          set: (v) => {
            debug.visibleRange = v;
            applyVisibleRange(landscape, v);
          },
        },
      ]);
    });
  }

  if (captureMode) {
    window.__sceneCapture = {
      advanceFrame(dtSeconds) {
        step(dtSeconds);
      },
      render() {
        renderer.render(scene, camera);
      },
    };
  }

  return () => lifecycle.dispose();
}

export { TIME_STEP };
