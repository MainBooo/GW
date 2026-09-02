import * as THREE from "three";
import { detectCapabilities, computeDrawingBufferSize, type Tier } from "../../core/capabilities";
import { SceneLifecycle, type SceneDisposer } from "../../core/scene-lifecycle";
import { showSceneFallback } from "../../core/scene-fallback";
import { FrameTimeMonitor } from "../../core/adaptive-quality";
import { FULLSCREEN_VERTEX_GLSL, createFullscreenPass } from "../../core/fullscreen-quad";
import { wantsCaptureHook, wantsDebugPanel } from "../../core/scene-capture";
import { buildGlassFragmentShader, type GlassShaderOptions } from "./shader";

interface TierConfig extends GlassShaderOptions {
  stepBudget: number;
}

const TIER_A: TierConfig = { stepBudget: 128, enableShadows: true, enableAO: true, fullAberration: true };
const TIER_B: TierConfig = { stepBudget: 64, enableShadows: false, enableAO: false, fullAberration: false };

function configForTier(tier: Tier): TierConfig {
  return tier === "A" ? TIER_A : TIER_B;
}

export interface GlassDebugParams {
  ior: number;
  aberration: number;
  roughness: number;
  stepBudget: number;
  morphSpeed: number;
}

const CAMERA_DISTANCE = 4.6;

export function initGlassScene(root: HTMLElement): SceneDisposer {
  const canvas = root.querySelector<HTMLCanvasElement>(".scene-canvas");
  if (!canvas) return () => {};

  const capabilities = detectCapabilities(canvas);

  if (capabilities.tier === "C" || !capabilities.gl) {
    showSceneFallback(root);
    return () => {};
  }

  root.classList.add("is-active");

  const config = configForTier(capabilities.tier);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: capabilities.gl,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  // Тонмаппинг и гамма делаются в шейдере — Three.js не должен добавлять своё,
  // иначе преобразование применится дважды и цвет станет вымытым.
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  const debug: GlassDebugParams = {
    ior: 1.48,
    aberration: 1.0,
    roughness: 0.06,
    stepBudget: config.stepBudget,
    morphSpeed: 1.0,
  };

  const material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: `precision highp float;\n${FULLSCREEN_VERTEX_GLSL}`,
    fragmentShader: buildGlassFragmentShader(config),
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uCameraPos: { value: new THREE.Vector3(0, 0.35, CAMERA_DISTANCE) },
      uCameraTarget: { value: new THREE.Vector3(0, 0, 0) },
      uStepBudget: { value: debug.stepBudget },
      uIor: { value: debug.ior },
      uAberration: { value: debug.aberration },
      uRoughness: { value: debug.roughness },
      uMorphSpeed: { value: debug.morphSpeed },
      uPointer: { value: new THREE.Vector2(0, 0) },
    },
  });

  const pass = createFullscreenPass(material);

  // Половинное разрешение включается только при устойчивой просадке.
  let resolutionScale = 1;

  function resize(): void {
    const rect = root.getBoundingClientRect();
    const { width } = computeDrawingBufferSize(rect.width, rect.height);
    const effectiveDpr = (width / Math.max(rect.width, 1)) * resolutionScale;
    renderer.setPixelRatio(effectiveDpr);
    renderer.setSize(rect.width, rect.height, false);
    material.uniforms.uResolution.value.set(canvas!.width, canvas!.height);
  }
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);

  const pointer = new THREE.Vector2(0, 0);
  const pointerTarget = new THREE.Vector2(0, 0);

  function onPointerMove(event: PointerEvent): void {
    const rect = canvas!.getBoundingClientRect();
    pointerTarget.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    lifecycle.requestRender();
  }

  function onPointerLeave(): void {
    pointerTarget.set(0, 0);
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);

  let elapsed = 0;

  function updateCamera(dt: number): void {
    // Плавная доводка к позиции курсора — резкие рывки камеры читаются как баг.
    pointer.lerp(pointerTarget, Math.min(1, dt * 3.5));

    const yaw = elapsed * 0.12 + pointer.x * 0.55;
    const pitch = 0.28 + pointer.y * 0.32;

    const camera = material.uniforms.uCameraPos.value as THREE.Vector3;
    camera.set(
      Math.sin(yaw) * Math.cos(pitch) * CAMERA_DISTANCE,
      Math.sin(pitch) * CAMERA_DISTANCE,
      Math.cos(yaw) * Math.cos(pitch) * CAMERA_DISTANCE,
    );
    (material.uniforms.uPointer.value as THREE.Vector2).copy(pointer);
  }

  function step(dt: number): void {
    elapsed += dt;
    material.uniforms.uTime.value = elapsed;
    updateCamera(dt);
  }

  const frameMonitor = new FrameTimeMonitor();
  let downgraded = false;

  const search = typeof window !== "undefined" ? window.location.search : "";
  const captureMode = wantsCaptureHook(search);

  const lifecycle: SceneLifecycle = new SceneLifecycle(canvas, {
    onFrame(deltaSeconds, elapsedSeconds) {
      if (captureMode) return;

      step(deltaSeconds);
      renderer.render(pass.scene, pass.camera);

      frameMonitor.push(deltaSeconds);
      if (!downgraded && frameMonitor.shouldDowngrade(elapsedSeconds)) {
        // Рендер в половинном разрешении с апскейлом средствами CSS:
        // drawing buffer уменьшается, элемент остаётся прежнего размера.
        resolutionScale = 0.5;
        downgraded = true;
        resize();
      }
    },
    onStaticFrame() {
      step(1 / 60);
      renderer.render(pass.scene, pass.camera);
    },
    onContextLost() {
      // Программа и юниформы будут пересозданы Three.js после восстановления.
    },
    onContextRestored() {
      material.needsUpdate = true;
      resize();
    },
    onDispose() {
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      pass.mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  });

  if (wantsDebugPanel(search)) {
    void import("../../core/debug-panel").then(({ mountDebugPanel }) => {
      mountDebugPanel(root, [
        {
          label: "Преломление",
          min: 1.05,
          max: 2.2,
          step: 0.01,
          get: () => debug.ior,
          set: (v) => {
            debug.ior = v;
            material.uniforms.uIor.value = v;
          },
        },
        {
          label: "Аберрация",
          min: 0,
          max: 4,
          step: 0.05,
          get: () => debug.aberration,
          set: (v) => {
            debug.aberration = v;
            material.uniforms.uAberration.value = v;
          },
        },
        {
          label: "Шероховатость",
          min: 0,
          max: 1,
          step: 0.01,
          get: () => debug.roughness,
          set: (v) => {
            debug.roughness = v;
            material.uniforms.uRoughness.value = v;
          },
        },
        {
          label: "Бюджет шагов",
          min: 16,
          max: 320,
          step: 8,
          get: () => debug.stepBudget,
          set: (v) => {
            debug.stepBudget = v;
            material.uniforms.uStepBudget.value = v;
          },
        },
        {
          label: "Скорость морфинга",
          min: 0,
          max: 3,
          step: 0.05,
          get: () => debug.morphSpeed,
          set: (v) => {
            debug.morphSpeed = v;
            material.uniforms.uMorphSpeed.value = v;
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
        renderer.render(pass.scene, pass.camera);
      },
    };
  }

  return () => lifecycle.dispose();
}
