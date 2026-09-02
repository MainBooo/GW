import * as THREE from "three";
import type { MarketField } from "./market-data";
import { LANDSCAPE_VERTEX_GLSL, LANDSCAPE_FRAGMENT_GLSL } from "./shader";

/**
 * Шаг по оси времени. Должен быть заметно крупнее шага корзины, иначе свечи
 * получаются уже ценовых ячеек и рельеф читается частоколом, а не ландшафтом.
 */
export const TIME_STEP = 0.15;
/** Полная ширина ландшафта по оси цены. */
export const PRICE_WIDTH = 13;
/** Базовая высота ландшафта до применения uHeightScale. */
export const BASE_HEIGHT = 3.2;
/** Зазор между дальним краем ландшафта и боковым профилем объёма. */
const PROFILE_Z_GAP = 1.5;

// Приглушённые: на дистанции сотни свечей насыщенные цвета дают рябь.
const COLOR_UP = new THREE.Color("#1f7d63");
const COLOR_DOWN = new THREE.Color("#8f3446");

export interface LandscapeGeometry {
  mesh: THREE.Mesh;
  profileMesh: THREE.Mesh;
  material: THREE.RawShaderMaterial;
  /** Индексов на одну свечу — для среза drawRange по времени. */
  indicesPerCandle: number;
  /** Мировая Z ценовой траектории по свечам — по ней ведётся камера. */
  centroidZ: Float32Array;
}

export function candleToWorldX(index: number, candleCount: number): number {
  return (index - (candleCount - 1) / 2) * TIME_STEP;
}

export function worldXToCandle(x: number, candleCount: number): number {
  return Math.round(x / TIME_STEP + (candleCount - 1) / 2);
}

/** Ценовая корзина → мировая координата Z (та же формула, что в геометрии). */
export function bucketToWorldZ(bucket: number, buckets: number): number {
  return -PRICE_WIDTH / 2 + bucket * (PRICE_WIDTH / buckets);
}

/**
 * Строит сеточную поверхность (candleCount+1) x (buckets+1) в типизированные
 * массивы. Вершины общие между соседними свечами — цвет и свечение
 * интерполируются по времени, что для ландшафта читается как плавный переход.
 * Индексы упорядочены по свече, поэтому drawRange режет геометрию по времени
 * без пересборки буферов.
 */
export function buildLandscape(field: MarketField): LandscapeGeometry {
  const { candleCount, buckets, cells, direction, atr, profile } = field;

  const cols = candleCount + 1;
  const rows = buckets + 1;
  const vertexCount = cols * rows;

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const glow = new Float32Array(vertexCount);

  const bucketStep = PRICE_WIDTH / buckets;
  const zOffset = -PRICE_WIDTH / 2;

  const cellAt = (i: number, j: number): number => {
    const ci = Math.min(i, candleCount - 1);
    const cj = Math.min(j, buckets - 1);
    return cells[ci * buckets + cj];
  };

  for (let i = 0; i < cols; i++) {
    const candleIndex = Math.min(i, candleCount - 1);
    const isUp = direction[candleIndex] > 0;
    const color = isUp ? COLOR_UP : COLOR_DOWN;
    const candleGlow = atr[candleIndex];
    const x = candleToWorldX(i, candleCount);

    for (let j = 0; j < rows; j++) {
      const v = i * rows + j;
      const height = cellAt(i, j);

      positions[v * 3] = x;
      positions[v * 3 + 1] = height * BASE_HEIGHT;
      positions[v * 3 + 2] = zOffset + j * bucketStep;

      colors[v * 3] = color.r;
      colors[v * 3 + 1] = color.g;
      colors[v * 3 + 2] = color.b;

      glow[v] = candleGlow;
    }
  }

  computeGridNormals(positions, normals, cols, rows);

  const indicesPerCandle = (rows - 1) * 6;
  const indices = new Uint32Array((cols - 1) * indicesPerCandle);
  let k = 0;
  for (let i = 0; i < cols - 1; i++) {
    for (let j = 0; j < rows - 1; j++) {
      const a = i * rows + j;
      const b = a + rows;
      indices[k++] = a;
      indices[k++] = b;
      indices[k++] = a + 1;
      indices[k++] = a + 1;
      indices[k++] = b;
      indices[k++] = b + 1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aGlow", new THREE.BufferAttribute(glow, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  const material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: LANDSCAPE_VERTEX_GLSL,
    fragmentShader: LANDSCAPE_FRAGMENT_GLSL,
    side: THREE.DoubleSide,
    uniforms: {
      uHeightScale: { value: 1 },
      uGlowStrength: { value: 0.8 },
      uFogColor: { value: new THREE.Color("#05070c") },
      uFloorColor: { value: new THREE.Color("#0d1119") },
      // Туман задаёт глубину обзора: без него в кадр попадают все 2000 свечей
      // сразу и рельеф вырождается в рябь субпиксельных столбцов.
      uFogDensity: { value: 0.045 },
    },
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;

  const centroidZ = new Float32Array(candleCount);
  for (let i = 0; i < candleCount; i++) {
    centroidZ[i] = bucketToWorldZ(field.centroidBucket[i], buckets);
  }

  return {
    mesh,
    profileMesh: buildVolumeProfile(profile, buckets, candleCount, material),
    material,
    indicesPerCandle,
    centroidZ,
  };
}

/**
 * Боковой слой: агрегированный профиль объёма по тем же корзинам за весь
 * период — вертикальная «занавесь» вдоль оси цены. Профиль не зависит от
 * времени, поэтому сцена двигает его по X вслед за камерой (см. main.ts),
 * иначе он был бы виден лишь в одной точке пролёта.
 */
function buildVolumeProfile(
  profile: Float32Array,
  buckets: number,
  _candleCount: number,
  material: THREE.RawShaderMaterial,
): THREE.Mesh {
  const rows = buckets + 1;
  const positions = new Float32Array(rows * 2 * 3);
  const normals = new Float32Array(rows * 2 * 3);
  const colors = new Float32Array(rows * 2 * 3);
  const glow = new Float32Array(rows * 2);

  const bucketStep = PRICE_WIDTH / buckets;
  // Профиль идёт по оси цены в ту же сторону и с тем же шагом, что и ландшафт,
  // просто сдвинут за его дальний край: только так корзина профиля оказывается
  // напротив той же цены на рельефе. Обратный порядок дал бы зеркало.
  const zOffset = -PRICE_WIDTH / 2 - PROFILE_Z_GAP - PRICE_WIDTH;
  const color = new THREE.Color("#4d6bbd");

  for (let j = 0; j < rows; j++) {
    const value = profile[Math.min(j, buckets - 1)];
    const z = zOffset + j * bucketStep;

    // Две вершины на корзину: основание и вершина столбца профиля.
    for (let side = 0; side < 2; side++) {
      const v = j * 2 + side;
      positions[v * 3] = 0;
      positions[v * 3 + 1] = side === 0 ? 0 : value * BASE_HEIGHT * 1.4;
      positions[v * 3 + 2] = z;

      normals[v * 3] = 1;
      normals[v * 3 + 1] = 0;
      normals[v * 3 + 2] = 0;

      colors[v * 3] = color.r;
      colors[v * 3 + 1] = color.g;
      colors[v * 3 + 2] = color.b;

      glow[v] = side === 0 ? 0 : value;
    }
  }

  const indices = new Uint32Array((rows - 1) * 6);
  let k = 0;
  for (let j = 0; j < rows - 1; j++) {
    const a = j * 2;
    indices[k++] = a;
    indices[k++] = a + 2;
    indices[k++] = a + 1;
    indices[k++] = a + 1;
    indices[k++] = a + 2;
    indices[k++] = a + 3;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aGlow", new THREE.BufferAttribute(glow, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

/** Нормали сеточной поверхности через центральные разности соседей по сетке. */
function computeGridNormals(positions: Float32Array, normals: Float32Array, cols: number, rows: number): void {
  const at = (i: number, j: number, component: number): number =>
    positions[(Math.min(Math.max(i, 0), cols - 1) * rows + Math.min(Math.max(j, 0), rows - 1)) * 3 + component];

  const normal = new THREE.Vector3();
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const dydx = at(i + 1, j, 1) - at(i - 1, j, 1);
      const dx = at(i + 1, j, 0) - at(i - 1, j, 0);
      const dydz = at(i, j + 1, 1) - at(i, j - 1, 1);
      const dz = at(i, j + 1, 2) - at(i, j - 1, 2);

      normal.set(-dydx / Math.max(dx, 1e-6), 1, -dydz / Math.max(dz, 1e-6)).normalize();

      const v = i * rows + j;
      normals[v * 3] = normal.x;
      normals[v * 3 + 1] = normal.y;
      normals[v * 3 + 2] = normal.z;
    }
  }
}
