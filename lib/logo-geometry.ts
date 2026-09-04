/**
 * Единый источник геометрии логотипа GenerationWeb — используется и
 * персистентным канвасом главной (components/cinematic/logo-scene.tsx), и
 * главой "Identity in Motion" на /lab (components/lab/chapters/identity-
 * chapter.tsx). Координаты выведены из существующего плоского знака
 * (public/logo/generationweb.svg, viewBox 424×388) простым масштабом и
 * центрированием — форма и соединения не перерисовывались "на глаз".
 */

const SVG_SCALE = 1 / 150
const SVG_CENTER = { x: 212, y: 194 }

function fromSvg(x: number, y: number, z: number): [number, number, number] {
  return [(x - SVG_CENTER.x) * SVG_SCALE, -(y - SVG_CENTER.y) * SVG_SCALE, z]
}

export type NodeId = "A" | "B" | "C" | "D" | "E" | "F"
export type MaterialId = "ceramic" | "sand" | "bordeaux"

export const NODES: Record<NodeId, { pos: [number, number, number]; material: MaterialId; r: number }> = {
  A: { pos: fromSvg(20, 224, -0.15), material: "ceramic", r: 0.1 },
  B: { pos: fromSvg(117, 48, -0.15), material: "ceramic", r: 0.09 },
  C: { pos: fromSvg(117, 364, -0.15), material: "ceramic", r: 0.09 },
  D: { pos: fromSvg(200, 199, 0), material: "sand", r: 0.12 },
  E: { pos: fromSvg(293, 18, 0.15), material: "bordeaux", r: 0.1 },
  F: { pos: fromSvg(401, 198, 0.15), material: "bordeaux", r: 0.1 },
}

export const EDGES: [NodeId, NodeId][] = [
  ["A", "B"],
  ["A", "D"],
  ["A", "C"],
  ["C", "D"],
  ["D", "E"],
  ["E", "F"],
  ["D", "F"],
]

export const MATERIAL_PROPS: Record<MaterialId, { color: string; roughness: number; clearcoat: number }> = {
  ceramic: { color: "#22232b", roughness: 0.82, clearcoat: 0.18 },
  sand: { color: "#c9ae82", roughness: 0.6, clearcoat: 0.22 },
  bordeaux: { color: "#6e2430", roughness: 0.5, clearcoat: 0.3 },
}

/**
 * Фиксированные смещения разлёта — не Math.random(), результат детерминирован.
 * Амплитуда ~0.8–1× габарита самого знака: детали расходятся, но кадр не
 * теряет визуальную связь с исходной формой (используется и в невидимой
 * fade-зоне на главной, и на весь экран в главе Identity in Motion на /lab).
 */
export const SCATTER: Record<NodeId, [number, number, number]> = {
  A: [-0.95, 0.3, -0.55],
  B: [-0.4, 1.05, 0.45],
  C: [-0.7, -1.0, 0.25],
  D: [0.1, 0.15, 0.8],
  E: [0.85, 0.9, -0.35],
  F: [1.1, -0.45, 0.2],
}

export const SCATTER_ROTATION: Record<NodeId, [number, number, number]> = {
  A: [0.6, -0.4, 0.2],
  B: [-0.3, 0.5, 0.4],
  C: [0.4, 0.3, -0.5],
  D: [0.2, -0.2, 0.3],
  E: [-0.5, 0.4, -0.3],
  F: [0.3, -0.5, 0.5],
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
