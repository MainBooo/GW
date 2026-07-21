"use client"

import { CameraRig } from "@/components/core/camera-rig"
import { ParticleField } from "@/components/core/particle-field"
import { Connections } from "@/components/core/connections"
import { PipelineLabels } from "@/components/core/pipeline-labels"
import { TechMapNodes } from "@/components/core/tech-map-nodes"

export function CoreScene({ count }: { count: number }) {
  return (
    <>
      <CameraRig />
      <fog attach="fog" args={["#06070d", 6, 20]} />
      <ambientLight intensity={0.15} />
      <ParticleField count={count} />
      <Connections />
      <PipelineLabels />
      <TechMapNodes />
    </>
  )
}
