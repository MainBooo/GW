/**
 * Plain mutable singleton read imperatively inside R3F's useFrame — a scroll-driven
 * WebGL scene needs to update every frame regardless of React's render cycle, so
 * this intentionally bypasses React state/context to avoid re-rendering the whole tree.
 */

export type CheckpointName =
  | "ring"
  | "sphere"
  | "stream"
  | "chaos"
  | "network"
  | "pipeline-0"
  | "pipeline-1"
  | "pipeline-2"
  | "pipeline-3"
  | "pipeline-4"
  | "pipeline-5"
  | "pipeline-6"
  | "screen"
  | "layers-shatter"
  | "layers-assembled"
  | "architecture"
  | "ecosystem"
  | "portal"

export const CHECKPOINT_ORDER: CheckpointName[] = [
  "ring",
  "sphere",
  "stream",
  "chaos",
  "network",
  "pipeline-0",
  "pipeline-1",
  "pipeline-2",
  "pipeline-3",
  "pipeline-4",
  "pipeline-5",
  "pipeline-6",
  "screen",
  "layers-shatter",
  "layers-assembled",
  "architecture",
  "ecosystem",
  "portal",
]

type Vec3 = { x: number; y: number; z: number }

export const sceneState = {
  checkpointA: "ring" as CheckpointName,
  checkpointB: "ring" as CheckpointName,
  progress: 0,
  mouse: { x: 0, y: 0 },
  mouseInfluence: 1,
  timeScale: 1,
  panelOpen: false,
  paused: false,
  reduced: false,
  techHoverIndex: null as number | null,
  cameraA: { x: 0, y: 0, z: 9 } as Vec3,
  cameraB: { x: 0, y: 0, z: 9 } as Vec3,
  lookA: { x: 0, y: 0, z: 0 } as Vec3,
  lookB: { x: 0, y: 0, z: 0 } as Vec3,
}

export function setCheckpointPair(a: CheckpointName, b: CheckpointName, t: number) {
  sceneState.checkpointA = a
  sceneState.checkpointB = b
  sceneState.progress = Math.min(1, Math.max(0, t))
}

export function setCameraPair(a: Vec3, b: Vec3, lookA: Vec3, lookB: Vec3) {
  sceneState.cameraA = a
  sceneState.cameraB = b
  sceneState.lookA = lookA
  sceneState.lookB = lookB
}
