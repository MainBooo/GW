import { NOISE_GLSL, buildCurlFbmGlsl } from "./noise";

export const HASH_GLSL = /* glsl */ `
// Dave Hoskins hash33 (widely used public-domain-style utility hash).
vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}
`;

export interface InitShaderOptions {
  /** Радиус сферы, в которую изначально помещаются частицы, в домене [-1, 1]. */
  radius: number;
}

/**
 * Инициализация состояния GPU-проходом: положение — равномерно в сфере,
 * скорость — нулевая, реальную скорость даст первый update-pass.
 * Никакой загрузки позиций с CPU.
 */
export function buildInitFragmentShader({ radius }: InitShaderOptions): string {
  return /* glsl */ `precision highp float;

${HASH_GLSL}

layout(location = 0) out vec4 outPosition;
layout(location = 1) out vec4 outVelocity;

void main() {
  vec3 h = hash33(vec3(gl_FragCoord.xy, 1.0));
  float theta = h.x * 6.28318530718;
  float phi = acos(2.0 * h.y - 1.0);
  float r = pow(h.z, 1.0 / 3.0) * ${radius.toFixed(6)};

  vec3 pos = vec3(sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi)) * r;

  // .w хранит возраст частицы в секундах, стартует с 0.
  outPosition = vec4(pos, 0.0);
  outVelocity = vec4(0.0, 0.0, 0.0, 0.0);
}
`;
}

export interface UpdateShaderOptions {
  octaves: number;
}

/**
 * Один update-pass: сначала считается nextVelocity (curl noise + затухание +
 * возмущение от курсора), из неё в том же шейдере — nextPosition.
 * MRT: location 0 — позиция, location 1 — скорость.
 */
export function buildUpdateFragmentShader({ octaves }: UpdateShaderOptions): string {
  return /* glsl */ `precision highp float;

uniform sampler2D tPosition;
uniform sampler2D tVelocity;
uniform float uDt;
uniform float uTime;
uniform float uCurlScale;
uniform float uCurlStrength;
uniform float uDamping;
uniform float uAttraction;
uniform float uLifetime;
uniform vec3 uPointer;
uniform float uPointerActive;
uniform float uPointerRadius;
uniform float uPointerStrength;

layout(location = 0) out vec4 outPosition;
layout(location = 1) out vec4 outVelocity;

${HASH_GLSL}
${NOISE_GLSL}
${buildCurlFbmGlsl(octaves)}

vec3 spawnPosition(vec2 fragCoord, float seed) {
  vec3 h = hash33(vec3(fragCoord, seed));
  float theta = h.x * 6.28318530718;
  float phi = acos(2.0 * h.y - 1.0);
  float r = pow(h.z, 1.0 / 3.0) * 0.8;
  return vec3(sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi)) * r;
}

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  vec4 posData = texelFetch(tPosition, texel, 0);
  vec4 velData = texelFetch(tVelocity, texel, 0);

  float age = posData.w + uDt;

  vec3 nextPos;
  vec3 nextVel;

  // Вышедшие за домен частицы возрождаются, а не заворачиваются по mod():
  // телепорт с одной стороны куба на другую рвёт линии тока, и вместо
  // филаментов на экране получается однородный шум по всему объёму.
  bool escaped = dot(posData.xyz, posData.xyz) > 1.0;

  if (age >= uLifetime || escaped) {
    nextPos = spawnPosition(gl_FragCoord.xy, uTime);
    nextVel = vec3(0.0);
    age = 0.0;
  } else {
    vec3 pos = posData.xyz;
    vec3 vel = velData.xyz;

    vec3 flow = curlNoiseFbm(pos * uCurlScale + vec3(0.0, 0.0, uTime * 0.05)) * uCurlStrength;
    vec3 attraction = -pos * uAttraction;

    nextVel = vel * uDamping + (flow + attraction) * uDt;

    if (uPointerActive > 0.5) {
      vec3 toPointer = uPointer - pos;
      float dist = length(toPointer);
      float falloff = 1.0 - smoothstep(0.0, uPointerRadius, dist);
      nextVel += normalize(toPointer + 1e-5) * falloff * uPointerStrength * uDt;
    }

    nextPos = pos + nextVel * uDt;
  }

  outPosition = vec4(nextPos, age);
  outVelocity = vec4(nextVel, velData.w);
}
`;
}

/** Вершинный шейдер рендера точек: позиция читается через texelFetch по индексу. */
export const POINTS_VERTEX_GLSL = /* glsl */ `precision highp float;

in float aIndex;

uniform sampler2D tPosition;
uniform sampler2D tVelocity;
uniform int uTextureSize;
uniform float uWorldScale;
uniform float uPointSize;
uniform float uLifetime;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out float vSpeed;
out float vLifeFrac;

void main() {
  int idx = int(aIndex + 0.5);
  ivec2 texel = ivec2(idx % uTextureSize, idx / uTextureSize);

  vec4 posData = texelFetch(tPosition, texel, 0);
  vec4 velData = texelFetch(tVelocity, texel, 0);
  vSpeed = length(velData.xyz);
  vLifeFrac = clamp(posData.w / max(uLifetime, 0.001), 0.0, 1.0);

  vec3 worldPos = posData.xyz * uWorldScale;
  vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  // Клапан размера намеренно низкий: при 1M частиц даже небольшое перекрытие
  // точек друг с другом при аддитивном блендинге быстро уходит в сплошную
  // засветку — совокупная площадь должна оставаться скромной долей канваса.
  gl_PointSize = clamp(uPointSize * (300.0 / max(-mvPosition.z, 0.001)), 0.75, 3.5);
}
`;

export const POINTS_FRAGMENT_GLSL = /* glsl */ `precision highp float;

in float vSpeed;
in float vLifeFrac;

uniform vec3 uColorSlow;
uniform vec3 uColorFast;
uniform float uSpeedScale;
uniform float uIntensity;

out vec4 outColor;

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = dot(uv, uv);
  if (d > 1.0) discard;

  // Плавное появление/исчезновение по возрасту, чтобы респаун не «хлопал».
  float fadeIn = smoothstep(0.0, 0.05, vLifeFrac);
  float fadeOut = 1.0 - smoothstep(0.85, 1.0, vLifeFrac);
  float lifeFade = fadeIn * fadeOut;

  float soft = (1.0 - smoothstep(0.0, 1.0, d)) * lifeFade;

  // Curl-шум бездивергентен: он не сгущает плотность, поэтому равномерное
  // облако остаётся равномерным и структура потока по плотности не читается.
  // Единственное, что её выдаёт, — модуль скорости, и контраст по нему нужен
  // резкий: линейная шкала даёт ровный туман без различимых линий тока.
  float speedT = pow(clamp(vSpeed * uSpeedScale, 0.0, 1.0), 3.0);
  vec3 color = mix(uColorSlow, uColorFast, speedT);
  soft *= mix(0.35, 1.0, speedT);

  // Аддитивный блендинг складывает вклады всех перекрывающихся точек, поэтому
  // яркость одной частицы гасится обратно их числу: без этого миллион частиц
  // засвечивает кадр в сплошное белое поле, а 256 тысяч выглядят тускло.
  outColor = vec4(color * soft * uIntensity, soft * uIntensity);
}
`;
