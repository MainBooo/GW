/**
 * SDF ray marching со стеклом: сферический трейсинг знаковых полей.
 * Это не рейтрейсинг — пересечений с геометрией не считается, поверхность
 * находится итеративным шагом по расстоянию до ближайшего тела.
 *
 * Бюджет шагов. uStepBudget — суммарный лимит вызовов SDF на пиксель: первичный
 * марш, нормали, три хроматических внутренних сегмента, тени и AO. Счётчик
 * gSteps инкрементируется внутри каждой map-функции, все циклы проверяют его и
 * выходят по исчерпании. Без такого общего счётчика один пиксель со стеклом
 * уходит в сотни вызовов, и «128 шагов» из уровней качества ничего не значат.
 *
 * Тонмаппинг. ACES и sRGB-кодирование делаются здесь. На стороне Three.js
 * должно стоять NoToneMapping и нейтральный outputColorSpace — иначе получится
 * двойное преобразование и вымытый цвет.
 */

export interface GlassShaderOptions {
  /** Мягкие тени сферическим трейсингом. На Tier B отключаются. */
  enableShadows: boolean;
  /** AO по SDF. На Tier B отключается. */
  enableAO: boolean;
  /**
   * Полная аберрация — три независимых внутренних марша (по одному на канал).
   * Упрощённая — один марш и разведение каналов по направлению выхода:
   * втрое дешевле, визуально близко на небольшом spread.
   */
  fullAberration: boolean;
}

export function buildGlassFragmentShader(options: GlassShaderOptions): string {
  return [
    `#define ENABLE_SHADOWS ${options.enableShadows ? 1 : 0}`,
    `#define ENABLE_AO ${options.enableAO ? 1 : 0}`,
    `#define FULL_ABERRATION ${options.fullAberration ? 1 : 0}`,
    GLASS_FRAGMENT_BODY,
  ].join("\n");
}

const GLASS_FRAGMENT_BODY = /* glsl */ `precision highp float;
precision highp int;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uCameraPos;
uniform vec3 uCameraTarget;
uniform int uStepBudget;
uniform float uIor;
uniform float uAberration;
uniform float uRoughness;
uniform float uMorphSpeed;
uniform vec2 uPointer;

out vec4 outColor;

const float PI = 3.14159265359;
const float PLANE_Y = -1.35;
const float MAX_DIST = 24.0;
const float SURFACE_EPS = 0.0006;

const float MAT_NONE = 0.0;
const float MAT_GLASS = 1.0;
const float MAT_PLANE = 2.0;

// Общий на пиксель счётчик вызовов SDF. Инкрементируется в mapGlass/mapScene.
int gSteps = 0;

vec3 sunDirection() {
  return normalize(vec3(0.45, 0.72, 0.35));
}

// --- Примитивы -------------------------------------------------------------

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

// Полиномиальный smooth minimum (Íñigo Quílez).
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

mat2 rot2(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

// --- Сцена -----------------------------------------------------------------

/**
 * Только стеклянные тела. Smooth minimum применяется исключительно между ними —
 * плоскость сюда не входит и потому не может слиться со стеклом.
 */
float mapGlass(vec3 p) {
  gSteps++;

  float t = uTime * uMorphSpeed;

  vec3 ps = p;
  ps.xz *= rot2(t * 0.35);
  ps.xy *= rot2(sin(t * 0.21) * 0.4);

  float sphere = sdSphere(ps - vec3(sin(t * 0.5) * 0.35, cos(t * 0.43) * 0.22, 0.0), 0.78);

  vec3 pt = ps;
  pt.yz *= rot2(t * 0.47 + 0.6);
  float torus = sdTorus(pt, vec2(0.95, 0.26));

  vec3 pb = ps;
  pb.xz *= rot2(-t * 0.31);
  float box = sdRoundBox(pb - vec3(0.0, sin(t * 0.37) * 0.3, 0.0), vec3(0.6), 0.12);

  float blend = 0.45 + 0.2 * sin(t * 0.29);
  float d = smin(sphere, torus, blend);
  d = smin(d, box, blend);
  return d;
}

/** Стекло и плоскость. Объединение жёсткое: min, без smooth-смешивания. */
vec2 mapScene(vec3 p) {
  float glass = mapGlass(p);
  float plane = p.y - PLANE_Y;
  return glass < plane ? vec2(glass, MAT_GLASS) : vec2(plane, MAT_PLANE);
}

/** Нормаль по градиенту SDF, epsilon растёт с расстоянием (борьба с дрожанием вдали). */
vec3 calcNormal(vec3 p, float dist) {
  float eps = max(SURFACE_EPS, dist * 0.0015);
  vec2 e = vec2(1.0, -1.0) * 0.5773;
  return normalize(
    e.xyy * mapScene(p + e.xyy * eps).x +
    e.yyx * mapScene(p + e.yyx * eps).x +
    e.yxy * mapScene(p + e.yxy * eps).x +
    e.xxx * mapScene(p + e.xxx * eps).x
  );
}

vec3 calcGlassNormal(vec3 p, float dist) {
  float eps = max(SURFACE_EPS, dist * 0.0015);
  vec2 e = vec2(1.0, -1.0) * 0.5773;
  return normalize(
    e.xyy * mapGlass(p + e.xyy * eps) +
    e.yyx * mapGlass(p + e.yyx * eps) +
    e.yxy * mapGlass(p + e.yxy * eps) +
    e.xxx * mapGlass(p + e.xxx * eps)
  );
}

// --- Марширование ----------------------------------------------------------

vec2 raymarch(vec3 ro, vec3 rd) {
  float t = 0.04;
  for (int i = 0; i < 256; i++) {
    if (gSteps >= uStepBudget) break;
    vec3 p = ro + rd * t;
    vec2 h = mapScene(p);
    if (h.x < SURFACE_EPS * t) return vec2(t, h.y);
    t += h.x;
    if (t > MAX_DIST) break;
  }
  return vec2(t, MAT_NONE);
}

/**
 * Марш внутри стекла: знак SDF инвертирован, идём до внутренней границы.
 * Это второй из двух переходов (вход и выход), а не «второй отскок» —
 * отражений внутри тела здесь не считается.
 */
float marchInside(vec3 ro, vec3 rd) {
  float t = 0.02;
  for (int i = 0; i < 96; i++) {
    if (gSteps >= uStepBudget) break;
    float d = -mapGlass(ro + rd * t);
    if (d < SURFACE_EPS) break;
    t += max(d, 0.004);
    if (t > 8.0) break;
  }
  return t;
}

float softShadow(vec3 ro, vec3 rd) {
#if ENABLE_SHADOWS
  float res = 1.0;
  float t = 0.05;
  for (int i = 0; i < 40; i++) {
    if (gSteps >= uStepBudget) break;
    float h = mapScene(ro + rd * t).x;
    res = min(res, 10.0 * h / t);
    t += clamp(h, 0.03, 0.35);
    if (res < 0.005 || t > 9.0) break;
  }
  return clamp(res, 0.0, 1.0);
#else
  return 1.0;
#endif
}

float calcAO(vec3 p, vec3 n) {
#if ENABLE_AO
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    if (gSteps >= uStepBudget) break;
    float h = 0.015 + 0.14 * float(i) / 4.0;
    float d = mapScene(p + n * h).x;
    occ += (h - d) * sca;
    sca *= 0.92;
  }
  return clamp(1.0 - 2.6 * occ, 0.0, 1.0);
#else
  return 1.0;
#endif
}

// --- Процедурная среда (без HDRI и любых текстур) --------------------------

vec3 skyColor(vec3 rd) {
  float up = clamp(rd.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 horizon = vec3(0.055, 0.075, 0.105);
  vec3 zenith = vec3(0.09, 0.16, 0.30);
  vec3 col = mix(horizon, zenith, pow(up, 0.85));

  vec3 sun = sunDirection();
  float cosSun = max(dot(rd, sun), 0.0);
  col += vec3(1.0, 0.86, 0.68) * pow(cosSun, 900.0) * 6.0;
  col += vec3(0.45, 0.38, 0.30) * pow(cosSun, 12.0) * 0.14;
  return col;
}

float checker(vec2 xz) {
  vec2 q = floor(xz * 0.75);
  return mod(q.x + q.y, 2.0);
}

/**
 * Аналитическая среда для вторичных лучей: пересечение с плоскостью считается
 * формулой, а не маршем, поэтому не тратит бюджет SDF-вызовов.
 */
vec3 sampleEnvironment(vec3 ro, vec3 rd) {
  if (rd.y < -0.0001) {
    float t = (PLANE_Y - ro.y) / rd.y;
    if (t > 0.0 && t < MAX_DIST) {
      vec3 p = ro + rd * t;
      float c = checker(p.xz);
      vec3 base = mix(vec3(0.035, 0.038, 0.045), vec3(0.085, 0.09, 0.10), c);
      float fade = exp(-t * 0.11);
      return mix(skyColor(rd), base, fade);
    }
  }
  return skyColor(rd);
}

// --- Джиттер для шероховатости --------------------------------------------

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

vec3 jitter(vec3 dir, vec3 seed, float amount) {
  if (amount <= 0.0001) return dir;
  vec3 r = hash33(seed) * 2.0 - 1.0;
  return normalize(dir + r * amount);
}

// --- Стекло ----------------------------------------------------------------

/** Френель по Шлику: доля отражённого света на границе сред. */
float fresnelSchlick(float cosTheta, float f0) {
  return f0 + (1.0 - f0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

/**
 * Один хроматический канал: вход в тело, марш внутри, выход наружу.
 * Две границы — вход и выход, а не «два отскока»: внутренних переотражений
 * здесь не считается. Полное внутреннее отражение обрабатывается явно —
 * refract() возвращает нулевой вектор, и тогда берётся отражение.
 * Возвращает точку выхода в .xyz и направление наружу через out-параметр.
 */
vec3 traceThroughGlass(vec3 pos, vec3 rd, vec3 n, float ior, vec3 seed, out vec3 dirOut) {
  vec3 dirIn = refract(rd, n, 1.0 / ior);
  if (dot(dirIn, dirIn) < 0.0001) {
    // ПВО уже на входе — для выпуклой границы снаружи физически невозможно,
    // но численно случается на скользящих углах: уходим в отражение.
    dirOut = reflect(rd, n);
    return pos;
  }

  vec3 insideStart = pos + dirIn * 0.012;
  float tInside = marchInside(insideStart, dirIn);
  vec3 exitPos = insideStart + dirIn * tInside;
  vec3 exitNormal = -calcGlassNormal(exitPos, tInside);

  dirOut = refract(dirIn, exitNormal, ior);
  if (dot(dirOut, dirOut) < 0.0001) {
    // Полное внутреннее отражение на выходе: свет остаётся в теле,
    // берём отражённое направление от внутренней границы.
    dirOut = reflect(dirIn, exitNormal);
  }

  dirOut = jitter(dirOut, seed, uRoughness * 0.08);
  return exitPos;
}

vec3 refractChannel(vec3 pos, vec3 rd, vec3 n, float ior, vec3 seed) {
  vec3 dirOut;
  vec3 exitPos = traceThroughGlass(pos, rd, n, ior, seed, dirOut);
  return sampleEnvironment(exitPos + dirOut * 0.01, dirOut);
}

vec3 shadeGlass(vec3 pos, vec3 rd, vec3 n, float dist) {
  // Три коэффициента преломления — основной источник хроматической аберрации.
  float spread = uAberration * 0.035;
  vec3 seed = pos * 37.0 + uTime;

  vec3 refracted;
#if FULL_ABERRATION
  // Полный вариант: независимый внутренний марш на каждый канал.
  refracted.r = refractChannel(pos, rd, n, uIor - spread, seed).r;
  refracted.g = refractChannel(pos, rd, n, uIor, seed + 1.7).g;
  refracted.b = refractChannel(pos, rd, n, uIor + spread, seed + 3.4).b;
#else
  // Упрощённый вариант (Tier B): один марш, каналы разводятся по направлению
  // выхода. Втрое дешевле по бюджету шагов, на малом spread почти неотличим.
  vec3 dirOut;
  vec3 exitPos = traceThroughGlass(pos, rd, n, uIor, seed, dirOut);
  vec3 bend = normalize(cross(dirOut, n) + 1e-5) * spread * 0.6;
  refracted.r = sampleEnvironment(exitPos + dirOut * 0.01, normalize(dirOut - bend)).r;
  refracted.g = sampleEnvironment(exitPos + dirOut * 0.01, dirOut).g;
  refracted.b = sampleEnvironment(exitPos + dirOut * 0.01, normalize(dirOut + bend)).b;
#endif

  vec3 reflectDir = jitter(reflect(rd, n), seed + 5.1, uRoughness * 0.05);
  vec3 reflected = sampleEnvironment(pos + reflectDir * 0.01, reflectDir);

  float f = fresnelSchlick(max(dot(-rd, n), 0.0), 0.045);
  vec3 col = mix(refracted, reflected, f);

  // Блик от солнца поверх — иначе стекло читается как мыльный пузырь.
  vec3 sun = sunDirection();
  vec3 h = normalize(sun - rd);
  float spec = pow(max(dot(n, h), 0.0), mix(220.0, 24.0, uRoughness));
  col += vec3(1.0, 0.93, 0.82) * spec * 0.55 * (0.25 + 0.75 * f);

  col *= mix(0.85, 1.0, calcAO(pos, n));
  return col;
}

vec3 shadePlane(vec3 pos, vec3 n) {
  float c = checker(pos.xz);
  vec3 albedo = mix(vec3(0.035, 0.038, 0.045), vec3(0.085, 0.09, 0.10), c);

  vec3 sun = sunDirection();
  float diff = max(dot(n, sun), 0.0);
  float sh = softShadow(pos + n * 0.02, sun);
  float ao = calcAO(pos, n);

  vec3 col = albedo * (0.09 + 0.9 * diff * sh);
  col += albedo * 0.16 * ao;
  return col;
}

// --- Тонмаппинг ------------------------------------------------------------

vec3 acesFilm(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;

  vec3 ro = uCameraPos;
  vec3 forward = normalize(uCameraTarget - ro);
  vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, forward);
  vec3 rd = normalize(uv.x * right + uv.y * up + 1.55 * forward);

  vec2 hit = raymarch(ro, rd);
  vec3 col;

  if (hit.y == MAT_GLASS) {
    vec3 pos = ro + rd * hit.x;
    vec3 n = calcNormal(pos, hit.x);
    col = shadeGlass(pos, rd, n, hit.x);
  } else if (hit.y == MAT_PLANE) {
    vec3 pos = ro + rd * hit.x;
    vec3 n = calcNormal(pos, hit.x);
    col = shadePlane(pos, n);
  } else {
    col = skyColor(rd);
  }

  // Лёгкая виньетка: направляет взгляд в центр, где находится тело.
  float vig = 1.0 - 0.22 * dot(uv, uv);
  col *= vig;

  col = acesFilm(col * 1.05);
  col = pow(col, vec3(1.0 / 2.2));

  outColor = vec4(col, 1.0);
}
`;
