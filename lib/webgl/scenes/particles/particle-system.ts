import * as THREE from "three";
import {
  buildInitFragmentShader,
  buildUpdateFragmentShader,
  POINTS_VERTEX_GLSL,
  POINTS_FRAGMENT_GLSL,
} from "./shaders";
import { FULLSCREEN_VERTEX_GLSL, createFullscreenMesh } from "../../core/fullscreen-quad";

const FIXED_DT = 1 / 60;
const MAX_SUBSTEPS = 2;
const DOMAIN_RADIUS = 0.8;

/** Масштаб перевода нормированного домена [-1, 1] частиц в мировые координаты сцены. */
export const WORLD_SCALE = 3.0;
export { FIXED_DT };

export interface ParticleSystemOptions {
  renderer: THREE.WebGLRenderer;
  gridSize: number;
  octaves: number;
  textureType: THREE.TextureDataType;
}

export interface ParticleDebugParams {
  curlScale: number;
  curlStrength: number;
  damping: number;
  attraction: number;
  lifetime: number;
  pointerRadius: number;
  pointerStrength: number;
  pointSize: number;
}

export const DEFAULT_DEBUG_PARAMS: ParticleDebugParams = {
  curlScale: 0.65,
  curlStrength: 1.3,
  damping: 0.985,
  attraction: 0.55,
  lifetime: 4.5,
  pointerRadius: 0.35,
  pointerStrength: 0.8,
  pointSize: 2.2,
};

/**
 * Опорное число частиц, под которое подобрана базовая яркость точки.
 * Сетки крупнее гасятся пропорционально, мельче — не усиливаются.
 */
const INTENSITY_REFERENCE_PARTICLES = 512 * 512;

function intensityForGrid(gridSize: number): number {
  return Math.min(1, INTENSITY_REFERENCE_PARTICLES / (gridSize * gridSize));
}

/** 4 текстуры (2 ping-pong таргета * 2 MRT-attachments), RGBA * bytesPerComponent. */
export function particleMemoryBytes(gridSize: number, bytesPerComponent: 2 | 4): number {
  const texelCount = gridSize * gridSize;
  const bytesPerTexel = 4 * bytesPerComponent;
  const textureCount = 4;
  return texelCount * bytesPerTexel * textureCount;
}

function makeFullscreenMesh(fragmentShader: string): THREE.Mesh {
  return createFullscreenMesh(
    new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: `precision highp float;\n${FULLSCREEN_VERTEX_GLSL}`,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    }),
  );
}

export class ParticleSystem {
  readonly points: THREE.Points;

  private renderer: THREE.WebGLRenderer;
  private gridSize: number;
  private octaves: number;
  private textureType: THREE.TextureDataType;

  private targetA: THREE.WebGLRenderTarget;
  private targetB: THREE.WebGLRenderTarget;
  private current: THREE.WebGLRenderTarget;
  private next: THREE.WebGLRenderTarget;

  private updateMesh: THREE.Mesh;
  private updateMaterial: THREE.RawShaderMaterial;
  private passScene = new THREE.Scene();
  private passCamera = new THREE.Camera();

  private pointsMaterial: THREE.RawShaderMaterial;

  private accumulator = 0;
  private elapsed = 0;

  debug: ParticleDebugParams = { ...DEFAULT_DEBUG_PARAMS };
  pointer = new THREE.Vector3();
  pointerActive = false;

  constructor(options: ParticleSystemOptions) {
    this.renderer = options.renderer;
    this.gridSize = options.gridSize;
    this.octaves = options.octaves;
    this.textureType = options.textureType;

    this.targetA = this.createRenderTarget(this.gridSize);
    this.targetB = this.createRenderTarget(this.gridSize);
    this.current = this.targetA;
    this.next = this.targetB;

    this.updateMaterial = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: `precision highp float;\n${FULLSCREEN_VERTEX_GLSL}`,
      fragmentShader: buildUpdateFragmentShader({ octaves: this.octaves }),
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tPosition: { value: null },
        tVelocity: { value: null },
        uDt: { value: FIXED_DT },
        uTime: { value: 0 },
        uCurlScale: { value: this.debug.curlScale },
        uCurlStrength: { value: this.debug.curlStrength },
        uDamping: { value: this.debug.damping },
        uAttraction: { value: this.debug.attraction },
        uLifetime: { value: this.debug.lifetime },
        uPointer: { value: this.pointer },
        uPointerActive: { value: 0 },
        uPointerRadius: { value: this.debug.pointerRadius },
        uPointerStrength: { value: this.debug.pointerStrength },
      },
    });
    this.updateMesh = createFullscreenMesh(this.updateMaterial);

    this.runInitPass();

    const count = this.gridSize * this.gridSize;
    const indices = new Float32Array(count);
    for (let i = 0; i < count; i++) indices[i] = i;
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("aIndex", new THREE.BufferAttribute(indices, 1));
    pointsGeometry.setDrawRange(0, count);

    this.pointsMaterial = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: POINTS_VERTEX_GLSL,
      fragmentShader: POINTS_FRAGMENT_GLSL,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        tPosition: { value: this.current.textures[0] },
        tVelocity: { value: this.current.textures[1] },
        uTextureSize: { value: this.gridSize },
        uWorldScale: { value: WORLD_SCALE },
        uPointSize: { value: this.debug.pointSize },
        uLifetime: { value: this.debug.lifetime },
        uColorSlow: { value: new THREE.Color("#2d6bff") },
        uColorFast: { value: new THREE.Color("#8ef6ff") },
        uSpeedScale: { value: 1.35 },
        uIntensity: { value: intensityForGrid(this.gridSize) },
      },
    });

    this.points = new THREE.Points(pointsGeometry, this.pointsMaterial);
    this.points.frustumCulled = false;
  }

  private createRenderTarget(size: number): THREE.WebGLRenderTarget {
    const rt = new THREE.WebGLRenderTarget(size, size, {
      count: 2,
      type: this.textureType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });
    return rt;
  }

  private runInitPass(): void {
    const initMesh = makeFullscreenMesh(buildInitFragmentShader({ radius: DOMAIN_RADIUS }));
    const scene = new THREE.Scene();
    scene.add(initMesh);

    const prevTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.current);
    this.renderer.render(scene, this.passCamera);
    this.renderer.setRenderTarget(prevTarget);

    initMesh.geometry.dispose();
    (initMesh.material as THREE.Material).dispose();
  }

  private runUpdatePass(dt: number): void {
    this.updateMaterial.uniforms.tPosition.value = this.current.textures[0];
    this.updateMaterial.uniforms.tVelocity.value = this.current.textures[1];
    this.updateMaterial.uniforms.uDt.value = dt;
    this.updateMaterial.uniforms.uTime.value = this.elapsed;
    this.updateMaterial.uniforms.uCurlScale.value = this.debug.curlScale;
    this.updateMaterial.uniforms.uCurlStrength.value = this.debug.curlStrength;
    this.updateMaterial.uniforms.uDamping.value = this.debug.damping;
    this.updateMaterial.uniforms.uAttraction.value = this.debug.attraction;
    this.updateMaterial.uniforms.uLifetime.value = this.debug.lifetime;
    this.updateMaterial.uniforms.uPointerActive.value = this.pointerActive ? 1 : 0;
    this.updateMaterial.uniforms.uPointerRadius.value = this.debug.pointerRadius;
    this.updateMaterial.uniforms.uPointerStrength.value = this.debug.pointerStrength;

    if (this.passScene.children.length === 0) {
      this.passScene.add(this.updateMesh);
    }

    const prevTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.next);
    this.renderer.render(this.passScene, this.passCamera);
    this.renderer.setRenderTarget(prevTarget);

    const swap = this.current;
    this.current = this.next;
    this.next = swap;

    this.pointsMaterial.uniforms.tPosition.value = this.current.textures[0];
    this.pointsMaterial.uniforms.tVelocity.value = this.current.textures[1];
  }

  /** Кадр рендера. deltaSeconds === 0 трактуется как возврат из паузы/фона. */
  step(deltaSeconds: number): void {
    if (deltaSeconds <= 0) {
      this.accumulator = 0;
      return;
    }

    this.elapsed += deltaSeconds;
    this.accumulator = Math.min(this.accumulator + deltaSeconds, MAX_SUBSTEPS * FIXED_DT);

    let substeps = 0;
    while (this.accumulator >= FIXED_DT && substeps < MAX_SUBSTEPS) {
      this.runUpdatePass(FIXED_DT);
      this.accumulator -= FIXED_DT;
      substeps++;
    }
  }

  setDebugParam<K extends keyof ParticleDebugParams>(key: K, value: ParticleDebugParams[K]): void {
    this.debug[key] = value;
    if (key === "pointSize") this.pointsMaterial.uniforms.uPointSize.value = value;
    if (key === "lifetime") this.pointsMaterial.uniforms.uLifetime.value = value;
  }

  /**
   * Пересоздаёт FBO меньшего размера при просадке. Уменьшение drawRange не
   * ускорило бы update-pass — шейдер всё равно считал бы всю текстуру, поэтому
   * снижаем именно размер сетки.
   */
  downgradeGridSize(newSize: number): void {
    if (newSize >= this.gridSize) return;
    this.gridSize = newSize;

    this.targetA.dispose();
    this.targetB.dispose();
    this.targetA = this.createRenderTarget(this.gridSize);
    this.targetB = this.createRenderTarget(this.gridSize);
    this.current = this.targetA;
    this.next = this.targetB;

    this.runInitPass();

    const count = this.gridSize * this.gridSize;
    const indices = new Float32Array(count);
    for (let i = 0; i < count; i++) indices[i] = i;
    this.points.geometry.setAttribute("aIndex", new THREE.BufferAttribute(indices, 1));
    this.points.geometry.setDrawRange(0, count);
    this.pointsMaterial.uniforms.uTextureSize.value = this.gridSize;
    this.pointsMaterial.uniforms.uIntensity.value = intensityForGrid(this.gridSize);
    this.pointsMaterial.uniforms.tPosition.value = this.current.textures[0];
    this.pointsMaterial.uniforms.tVelocity.value = this.current.textures[1];
  }

  /** Пересобирает update-материал с новым числом октав (для debug-панели, обе стороны). */
  setOctaves(newOctaves: number): void {
    const clamped = Math.max(1, Math.min(6, Math.round(newOctaves)));
    if (clamped === this.octaves) return;
    this.octaves = clamped;
    this.updateMaterial.fragmentShader = buildUpdateFragmentShader({ octaves: this.octaves });
    this.updateMaterial.needsUpdate = true;
  }

  /** Снижает число октав curl-шума при просадке — не поднимает обратно. */
  downgradeOctaves(newOctaves: number): void {
    if (newOctaves >= this.octaves) return;
    this.setOctaves(newOctaves);
  }

  get currentGridSize(): number {
    return this.gridSize;
  }

  get currentOctaves(): number {
    return this.octaves;
  }

  dispose(): void {
    this.targetA.dispose();
    this.targetB.dispose();
    this.updateMesh.geometry.dispose();
    this.updateMaterial.dispose();
    this.points.geometry.dispose();
    this.pointsMaterial.dispose();
  }
}
