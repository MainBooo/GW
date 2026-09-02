import { mountDebugPanel, type DebugSlider } from "../../core/debug-panel";
import type { ParticleSystem, ParticleDebugParams } from "./particle-system";

function param(
  system: ParticleSystem,
  key: keyof ParticleDebugParams,
  label: string,
  min: number,
  max: number,
  step: number,
): DebugSlider {
  return {
    label,
    min,
    max,
    step,
    get: () => system.debug[key],
    set: (value) => system.setDebugParam(key, value),
  };
}

export function mountParticlesDebugPanel(root: HTMLElement, system: ParticleSystem): () => void {
  return mountDebugPanel(root, [
    param(system, "curlScale", "Масштаб шума", 0.1, 4, 0.05),
    {
      label: "Число октав",
      min: 1,
      max: 6,
      step: 1,
      get: () => system.currentOctaves,
      set: (value) => system.setOctaves(value),
    },
    param(system, "curlStrength", "Сила завихрения", 0, 3, 0.05),
    param(system, "damping", "Затухание", 0.8, 1, 0.001),
    param(system, "attraction", "Притяжение", 0, 1, 0.01),
    param(system, "pointSize", "Размер частицы", 0.5, 10, 0.1),
    param(system, "lifetime", "Время жизни, с", 1, 20, 0.5),
  ]);
}
