export type DeviceTier = "full" | "lite" | "static"

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    )
  } catch {
    return false
  }
}

export function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "lite"

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (reducedMotion) return "static"
  if (!hasWebGL()) return "static"

  const isCoarse = window.matchMedia("(pointer: coarse)").matches
  const isNarrow = window.matchMedia("(max-width: 768px)").matches
  const nav = navigator as Navigator & { deviceMemory?: number }
  const mem = nav.deviceMemory
  const cores = navigator.hardwareConcurrency ?? 4

  if (mem !== undefined && mem <= 2) return "static"

  if (isCoarse || isNarrow) return "lite"
  if (cores <= 2) return "lite"

  return "full"
}

export const PARTICLE_COUNTS: Record<DeviceTier, number> = {
  full: 6000,
  lite: 1600,
  static: 0,
}
