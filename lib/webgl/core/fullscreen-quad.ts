import * as THREE from "three";

/**
 * Полноэкранный треугольник без буфера вершин: координаты берутся из gl_VertexID.
 * Треугольник, а не квад — нет шва по диагонали и на один растеризуемый примитив меньше.
 */
export const FULLSCREEN_VERTEX_GLSL = /* glsl */ `
void main() {
  vec2 pos = vec2(0.0);
  if (gl_VertexID == 0) pos = vec2(-1.0, -1.0);
  if (gl_VertexID == 1) pos = vec2(3.0, -1.0);
  if (gl_VertexID == 2) pos = vec2(-1.0, 3.0);
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

/**
 * Three.js выводит число вершин из атрибута 'position'. Его здесь нет, поэтому
 * drawRange нужно задать явно — иначе drawCount остаётся Infinity и
 * renderBufferDirect молча пропускает отрисовку.
 */
export function createFullscreenMesh(material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("aDummy", new THREE.BufferAttribute(new Float32Array(3), 1));
  geometry.setDrawRange(0, 3);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

/** Сцена и камера для полноэкранного прохода: без матриц, шейдер пишет clip-space напрямую. */
export function createFullscreenPass(material: THREE.Material): {
  scene: THREE.Scene;
  camera: THREE.Camera;
  mesh: THREE.Mesh;
} {
  const mesh = createFullscreenMesh(material);
  const scene = new THREE.Scene();
  scene.add(mesh);
  return { scene, camera: new THREE.Camera(), mesh };
}
