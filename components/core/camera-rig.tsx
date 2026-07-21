"use client"

import { useRef } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { sceneState } from "@/lib/scene-store"

export function CameraRig() {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3(0, 0, 9))
  const targetLook = useRef(new THREE.Vector3(0, 0, 0))
  const currentLook = useRef(new THREE.Vector3(0, 0, 0))
  const posA = useRef(new THREE.Vector3())
  const posB = useRef(new THREE.Vector3())
  const lookA = useRef(new THREE.Vector3())
  const lookB = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    const a = sceneState.cameraA
    const b = sceneState.cameraB
    const la = sceneState.lookA
    const lb = sceneState.lookB
    posA.current.set(a.x, a.y, a.z)
    posB.current.set(b.x, b.y, b.z)
    lookA.current.set(la.x, la.y, la.z)
    lookB.current.set(lb.x, lb.y, lb.z)

    targetPos.current.copy(posA.current).lerp(posB.current, sceneState.progress)
    targetLook.current.copy(lookA.current).lerp(lookB.current, sceneState.progress)

    const smoothing = sceneState.reduced ? 1 : Math.min(1, delta * 2.1)
    camera.position.lerp(targetPos.current, smoothing)
    currentLook.current.lerp(targetLook.current, smoothing)
    camera.lookAt(currentLook.current)
  })

  return null
}
