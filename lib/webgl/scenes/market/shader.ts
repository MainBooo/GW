/**
 * Ландшафт объёма: обычная сеточная геометрия, освещение по нормали плюс
 * свечение от ATR. Цвет приходит атрибутом (направление свечи), свечение —
 * отдельным атрибутом, чтобы не пересобирать геометрию при смене силы свечения.
 */
export const LANDSCAPE_VERTEX_GLSL = /* glsl */ `precision highp float;

in vec3 position;
in vec3 normal;
in vec3 aColor;
in float aGlow;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform float uHeightScale;

out vec3 vColor;
out float vGlow;
out vec3 vNormal;
out float vHeight;
out float vViewDepth;

void main() {
  vec3 scaled = vec3(position.x, position.y * uHeightScale, position.z);

  // Нормаль пересчитывается под масштаб высоты: без этого при изменении
  // uHeightScale освещение остаётся от исходной, слишком плоской поверхности.
  vec3 n = normalize(vec3(normal.x, normal.y / max(uHeightScale, 0.001), normal.z));

  vColor = aColor;
  vGlow = aGlow;
  vNormal = normalize(normalMatrix * n);
  vHeight = position.y;

  vec4 mvPosition = modelViewMatrix * vec4(scaled, 1.0);
  vViewDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const LANDSCAPE_FRAGMENT_GLSL = /* glsl */ `precision highp float;

in vec3 vColor;
in float vGlow;
in vec3 vNormal;
in float vHeight;
in float vViewDepth;

uniform float uGlowStrength;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uFloorColor;

out vec4 outColor;

vec3 acesFilm(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 keyDir = normalize(vec3(0.4, 0.85, 0.35));
  vec3 fillDir = normalize(vec3(-0.5, 0.35, -0.4));

  float key = max(dot(n, keyDir), 0.0);
  float fill = max(dot(n, fillDir), 0.0) * 0.35;
  float ambient = 0.18;

  // Пустые ячейки (цена в корзину не заходила) — это фон, а не наблюдение.
  // Без такого гашения плоский пол из нулей красится в цвет свечи и вся сцена
  // читается штрихкодом вместо ленты рельефа, вьющейся по ценовому диапазону.
  float presence = smoothstep(0.0, 0.12, vHeight);
  vec3 albedo = mix(uFloorColor, vColor, presence);

  vec3 base = albedo * (ambient + key + fill);

  // Свечение по ATR: подсвечивает участки высокой волатильности.
  base += vColor * vGlow * uGlowStrength * presence * (0.35 + 0.65 * vHeight);

  // Гребни рельефа читаются лучше со светлой кромкой на вершинах.
  base += vColor * pow(clamp(vHeight, 0.0, 1.0), 3.0) * 0.3;

  float fog = 1.0 - exp(-vViewDepth * uFogDensity);
  vec3 col = mix(base, uFogColor, clamp(fog, 0.0, 1.0));

  col = acesFilm(col);
  col = pow(col, vec3(1.0 / 2.2));
  outColor = vec4(col, 1.0);
}
`;
