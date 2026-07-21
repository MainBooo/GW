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

// Shared timing budget for the TechMap -> FinalCta handoff: tech nodes must
// reach opacity 0 (ECOSYSTEM_EXIT_FADE) before the CTA card starts fading in
// (FINAL_CTA_ENTER_START), with a small buffer between them to absorb the one
// frame of lerp lag in TechMapNodes' opacity smoothing. Both scenes read the
// same sceneState.progress value while FinalCta is the active track, so
// driving both animations off these constants guarantees no visual overlap
// regardless of scroll speed or how the section was entered.
export const ECOSYSTEM_EXIT_FADE = 0.16
export const FINAL_CTA_ENTER_START = 0.22
export const FINAL_CTA_ENTER_END = 0.38

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
