import type { CheckpointName } from "@/lib/scene-store"

export type Vec3 = { x: number; y: number; z: number }

export type CheckpointDef = {
  camera: Vec3
  look: Vec3
  color: [number, number, number]
  generate: (count: number, rand: () => number) => Float32Array
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRand(seed = 1337): () => number {
  return mulberry32(seed)
}

function inSphere(radius: number, rand: () => number): Vec3 {
  const u = rand()
  const v = rand()
  const theta = u * Math.PI * 2
  const phi = Math.acos(2 * v - 1)
  const r = radius * Math.cbrt(rand())
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
  }
}

function fibonacciSphere(count: number, radius: number, jitter: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    const jx = (rand() - 0.5) * jitter
    const jy = (rand() - 0.5) * jitter
    const jz = (rand() - 0.5) * jitter
    out[i * 3] = Math.cos(theta) * r * radius + jx
    out[i * 3 + 1] = y * radius + jy
    out[i * 3 + 2] = Math.sin(theta) * r * radius + jz
  }
  return out
}

function torusRing(count: number, radius: number, tube: number, jitter: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2 + rand() * 0.02
    const phi = rand() * Math.PI * 2
    const tr = tube * (0.4 + rand() * 0.6)
    const jx = (rand() - 0.5) * jitter
    const jy = (rand() - 0.5) * jitter
    const jz = (rand() - 0.5) * jitter
    out[i * 3] = (radius + tr * Math.cos(phi)) * Math.cos(theta) + jx
    out[i * 3 + 1] = tr * Math.sin(phi) * 1.4 + jy
    out[i * 3 + 2] = (radius + tr * Math.cos(phi)) * Math.sin(theta) + jz
  }
  return out
}

function chaosCloud(count: number, radius: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const p = inSphere(radius, rand)
    out[i * 3] = p.x
    out[i * 3 + 1] = p.y * 0.85
    out[i * 3 + 2] = p.z
  }
  return out
}

function verticalStream(count: number, height: number, radius: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const y = (i / count - 0.5) * height + (rand() - 0.5) * 0.3
    const spiral = y * 0.9
    const r = radius * (0.3 + rand() * 0.7)
    const a = spiral + rand() * Math.PI * 2 * 0.15
    out[i * 3] = Math.cos(a) * r
    out[i * 3 + 1] = y
    out[i * 3 + 2] = Math.sin(a) * r
  }
  return out
}

function clusterNodes(
  count: number,
  centers: Vec3[],
  nodeRadius: number,
  revealCount: number,
  rand: () => number,
): Float32Array {
  const out = new Float32Array(count * 3)
  const groups = centers.length
  for (let i = 0; i < count; i++) {
    const g = i % groups
    const center = centers[g]
    if (g < revealCount) {
      const p = inSphere(nodeRadius, rand)
      out[i * 3] = center.x + p.x
      out[i * 3 + 1] = center.y + p.y
      out[i * 3 + 2] = center.z + p.z
    } else {
      // not yet arrived: scattered along an approach path toward the node, from "upstream" in z
      const t = rand()
      const fromZ = center.z + 5 + rand() * 4
      out[i * 3] = center.x + (rand() - 0.5) * nodeRadius * 3
      out[i * 3 + 1] = center.y + (rand() - 0.5) * nodeRadius * 3
      out[i * 3 + 2] = fromZ - t * 2
    }
  }
  return out
}

function layerPlanes(
  count: number,
  layers: { z: number; w: number; h: number; jitter: number }[],
  rand: () => number,
): Float32Array {
  const out = new Float32Array(count * 3)
  const n = layers.length
  for (let i = 0; i < count; i++) {
    const layer = layers[i % n]
    out[i * 3] = (rand() - 0.5) * layer.w + (rand() - 0.5) * layer.jitter
    out[i * 3 + 1] = (rand() - 0.5) * layer.h + (rand() - 0.5) * layer.jitter
    out[i * 3 + 2] = layer.z + (rand() - 0.5) * layer.jitter
  }
  return out
}

function screenPlane(count: number, w: number, h: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3)
  const borderFraction = 0.55
  for (let i = 0; i < count; i++) {
    if (rand() < borderFraction) {
      // border outline
      const side = Math.floor(rand() * 4)
      const t = (rand() - 0.5) * 2
      if (side === 0) {
        out[i * 3] = t * w
        out[i * 3 + 1] = h
      } else if (side === 1) {
        out[i * 3] = t * w
        out[i * 3 + 1] = -h
      } else if (side === 2) {
        out[i * 3] = w
        out[i * 3 + 1] = t * h
      } else {
        out[i * 3] = -w
        out[i * 3 + 1] = t * h
      }
    } else {
      out[i * 3] = (rand() - 0.5) * 2 * w
      out[i * 3 + 1] = (rand() - 0.5) * 2 * h
    }
    out[i * 3 + 2] = (rand() - 0.5) * 0.4
  }
  return out
}

function galaxyEcosystem(count: number, radius: number, arms: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const armIndex = i % arms
    const t = rand()
    const r = t * radius
    const angle = (armIndex / arms) * Math.PI * 2 + t * 3.2 + (rand() - 0.5) * 0.5
    const height = (rand() - 0.5) * (1 - t) * radius * 0.35
    out[i * 3] = Math.cos(angle) * r
    out[i * 3 + 1] = height
    out[i * 3 + 2] = Math.sin(angle) * r
  }
  return out
}

function portalTunnel(count: number, rings: number, radius: number, depth: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const ring = i % rings
    const rt = ring / rings
    const r = radius * (1 - rt * 0.82)
    const z = -rt * depth
    const a = (i / count) * Math.PI * 2 * 7 + rand() * 0.2
    out[i * 3] = Math.cos(a) * r
    out[i * 3 + 1] = Math.sin(a) * r
    out[i * 3 + 2] = z
  }
  return out
}

const PIPELINE_NODES: Vec3[] = [
  { x: -6.5, y: 0.6, z: 0 },
  { x: -3.9, y: -0.4, z: -0.6 },
  { x: -1.3, y: 0.5, z: 0.2 },
  { x: 1.3, y: -0.5, z: -0.4 },
  { x: 3.9, y: 0.4, z: 0.3 },
  { x: 6.5, y: -0.6, z: 0 },
]

const ARCHITECTURE_NODES: Vec3[] = [
  { x: -3.6, y: 1.6, z: 0 },
  { x: 0, y: 2.1, z: -0.3 },
  { x: 3.6, y: 1.6, z: 0 },
  { x: -3.6, y: -1.6, z: 0.2 },
  { x: 0, y: -2.1, z: -0.2 },
  { x: 3.6, y: -1.6, z: 0.2 },
]

export const PIPELINE_NODE_POSITIONS = PIPELINE_NODES
export const ARCHITECTURE_NODE_POSITIONS = ARCHITECTURE_NODES

export type TechCategory = {
  key: string
  label: string
  items: string[]
  pos: Vec3
}

export const TECH_CATEGORIES: TechCategory[] = [
  { key: "frontend", label: "Frontend", items: ["Next.js", "React", "TypeScript"], pos: { x: 0, y: 2.5, z: 0 } },
  { key: "backend", label: "Backend", items: ["NestJS", "Node.js", "REST API"], pos: { x: 3.1, y: 1.6, z: 0.6 } },
  { key: "data", label: "Data", items: ["PostgreSQL", "Prisma", "Redis"], pos: { x: 3.1, y: -1.8, z: -0.6 } },
  { key: "infra", label: "Infrastructure", items: ["Docker", "PM2", "BullMQ", "Linux"], pos: { x: 0, y: -2.8, z: 0 } },
  { key: "automation", label: "Automation", items: ["Playwright", "Background workers", "Schedulers"], pos: { x: -3.1, y: -1.6, z: 0.6 } },
  { key: "ai", label: "AI", items: ["LLM API", "RAG", "AI agents", "Structured outputs"], pos: { x: -3.1, y: 1.8, z: -0.6 } },
]

const COLOR_BLUE: [number, number, number] = [0.16, 0.66, 1]
const COLOR_VIOLET: [number, number, number] = [0.5, 0.42, 1]
const COLOR_CYAN: [number, number, number] = [0.2, 0.9, 0.77]
const COLOR_ROSE: [number, number, number] = [1, 0.42, 0.55]

export const CHECKPOINTS: Record<CheckpointName, CheckpointDef> = {
  ring: {
    camera: { x: 0, y: 0, z: 9 },
    look: { x: 0, y: 0, z: 0 },
    color: COLOR_BLUE,
    generate: (count, rand) => torusRing(count, 2.6, 0.55, 0.25, rand),
  },
  sphere: {
    camera: { x: 0, y: 0, z: 8.4 },
    look: { x: 0, y: 0, z: 0 },
    color: COLOR_BLUE,
    generate: (count, rand) => fibonacciSphere(count, 2.35, 0.18, rand),
  },
  stream: {
    camera: { x: 0, y: 0.4, z: 8 },
    look: { x: 0, y: 0, z: 0 },
    color: COLOR_VIOLET,
    generate: (count, rand) => verticalStream(count, 14, 1.8, rand),
  },
  chaos: {
    camera: { x: 0.5, y: 0, z: 10 },
    look: { x: 0, y: 0, z: 0 },
    color: COLOR_VIOLET,
    generate: (count, rand) => chaosCloud(count, 5.2, rand),
  },
  network: {
    camera: { x: 0, y: 0.2, z: 9.5 },
    look: { x: 0, y: 0, z: 0 },
    color: COLOR_CYAN,
    generate: (count, rand) =>
      clusterNodes(
        count,
        [
          { x: -3, y: 1.6, z: 0 },
          { x: 3, y: 1.4, z: 0.4 },
          { x: -2.6, y: -1.7, z: -0.3 },
          { x: 2.8, y: -1.5, z: 0.2 },
        ],
        1.05,
        4,
        rand,
      ),
  },
  "pipeline-0": {
    camera: { x: -6.5, y: 0.6, z: 7 },
    look: { x: -6.5, y: 0.6, z: 0 },
    color: COLOR_BLUE,
    generate: (count, rand) => clusterNodes(count, PIPELINE_NODES, 0.8, 0, rand),
  },
  "pipeline-1": {
    camera: { x: -6.5, y: 0.6, z: 6.2 },
    look: { x: -6.5, y: 0.6, z: 0 },
    color: COLOR_BLUE,
    generate: (count, rand) => clusterNodes(count, PIPELINE_NODES, 0.8, 1, rand),
  },
  "pipeline-2": {
    camera: { x: -3.9, y: -0.4, z: 6.2 },
    look: { x: -3.9, y: -0.4, z: 0 },
    color: COLOR_BLUE,
    generate: (count, rand) => clusterNodes(count, PIPELINE_NODES, 0.8, 2, rand),
  },
  "pipeline-3": {
    camera: { x: -1.3, y: 0.5, z: 6.2 },
    look: { x: -1.3, y: 0.5, z: 0 },
    color: COLOR_VIOLET,
    generate: (count, rand) => clusterNodes(count, PIPELINE_NODES, 0.8, 3, rand),
  },
  "pipeline-4": {
    camera: { x: 1.3, y: -0.5, z: 6.2 },
    look: { x: 1.3, y: -0.5, z: 0 },
    color: COLOR_VIOLET,
    generate: (count, rand) => clusterNodes(count, PIPELINE_NODES, 0.8, 4, rand),
  },
  "pipeline-5": {
    camera: { x: 3.9, y: 0.4, z: 6.2 },
    look: { x: 3.9, y: 0.4, z: 0 },
    color: COLOR_CYAN,
    generate: (count, rand) => clusterNodes(count, PIPELINE_NODES, 0.8, 5, rand),
  },
  "pipeline-6": {
    camera: { x: 0, y: 0.1, z: 10.5 },
    look: { x: 0, y: 0, z: 0 },
    color: COLOR_CYAN,
    generate: (count, rand) => clusterNodes(count, PIPELINE_NODES, 0.8, 6, rand),
  },
  screen: {
    camera: { x: 0, y: 0, z: 7.5 },
    look: { x: 0, y: 0, z: 0 },
    color: COLOR_CYAN,
    generate: (count, rand) => screenPlane(count, 4.4, 2.6, rand),
  },
  "layers-shatter": {
    camera: { x: 1.2, y: 0.3, z: 9 },
    look: { x: 0, y: 0, z: -1 },
    color: COLOR_ROSE,
    generate: (count, rand) =>
      layerPlanes(
        count,
        [
          { z: 2.4, w: 3.2, h: 2, jitter: 1.4 },
          { z: 0.8, w: 3.6, h: 2.2, jitter: 1.6 },
          { z: -0.8, w: 3.2, h: 2, jitter: 1.4 },
          { z: -2.4, w: 3.6, h: 2.2, jitter: 1.6 },
        ],
        rand,
      ),
  },
  "layers-assembled": {
    camera: { x: 0, y: 0, z: 7 },
    look: { x: 0, y: 0, z: 0 },
    color: COLOR_ROSE,
    generate: (count, rand) =>
      layerPlanes(
        count,
        [
          { z: 0.3, w: 3.6, h: 2.2, jitter: 0.2 },
          { z: 0.1, w: 3.6, h: 2.2, jitter: 0.2 },
          { z: -0.1, w: 3.6, h: 2.2, jitter: 0.2 },
          { z: -0.3, w: 3.6, h: 2.2, jitter: 0.2 },
        ],
        rand,
      ),
  },
  architecture: {
    camera: { x: 0, y: 0, z: 9 },
    look: { x: 0, y: 0, z: 0 },
    color: COLOR_BLUE,
    generate: (count, rand) => clusterNodes(count, ARCHITECTURE_NODES, 0.85, 6, rand),
  },
  ecosystem: {
    camera: { x: 0, y: 3, z: 8 },
    look: { x: 0, y: 0, z: 0 },
    color: COLOR_VIOLET,
    generate: (count, rand) => galaxyEcosystem(count, 5.4, 5, rand),
  },
  portal: {
    camera: { x: 0, y: 0, z: 5 },
    look: { x: 0, y: 0, z: -6 },
    color: COLOR_ROSE,
    generate: (count, rand) => portalTunnel(count, 10, 3.4, 9, rand),
  },
}

export function generateAllCheckpoints(count: number, seed = 1337): Record<CheckpointName, Float32Array> {
  const rand = createRand(seed)
  const out = {} as Record<CheckpointName, Float32Array>
  for (const [name, def] of Object.entries(CHECKPOINTS)) {
    out[name as CheckpointName] = def.generate(count, rand)
  }
  return out
}
