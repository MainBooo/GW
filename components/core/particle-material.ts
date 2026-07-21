import * as THREE from "three"

export const vertexShader = /* glsl */ `
  attribute vec3 aPosA;
  attribute vec3 aPosB;
  attribute float aSeed;

  uniform float uProgress;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseInfluence;
  uniform float uPixelRatio;
  uniform float uSize;

  varying float vSeed;
  varying float vDepth;
  varying float vCore;

  void main() {
    vec3 base = mix(aPosA, aPosB, uProgress);

    vec3 wiggle = vec3(
      sin(uTime * 0.5 + aSeed * 10.0),
      cos(uTime * 0.42 + aSeed * 14.0),
      sin(uTime * 0.33 + aSeed * 7.0)
    ) * 0.055;

    vec3 pos = base + wiggle;

    vec2 toMouse = pos.xy - uMouse;
    float d = length(toMouse);
    float repel = smoothstep(2.4, 0.0, d) * uMouseInfluence;
    pos.xy += normalize(toMouse + 0.0001) * repel * 0.6;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float sizeAttenuation = 320.0 / max(0.001, -mvPosition.z);
    gl_PointSize = uSize * uPixelRatio * sizeAttenuation * (0.75 + 0.5 * fract(aSeed * 91.7));
    gl_Position = projectionMatrix * mvPosition;

    vSeed = aSeed;
    vDepth = clamp(-mvPosition.z / 14.0, 0.0, 1.0);
    vCore = repel;
  }
`

export const fragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vSeed;
  varying float vDepth;
  varying float vCore;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    float alpha = smoothstep(1.0, 0.0, d);
    alpha = pow(alpha, 1.6);

    vec3 color = uColor;
    color += vec3(1.0, 0.95, 0.9) * (1.0 - smoothstep(0.0, 0.35, d)) * 0.5;
    color += vCore * vec3(1.0, 0.5, 0.6) * 0.6;

    float depthFade = mix(1.0, 0.35, vDepth);
    gl_FragColor = vec4(color, alpha * uOpacity * depthFade);
  }
`

export function createParticleMaterial(color: THREE.ColorRepresentation) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseInfluence: { value: 1 },
      uPixelRatio: { value: 1 },
      uSize: { value: 6 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0.9 },
    },
  })
}
