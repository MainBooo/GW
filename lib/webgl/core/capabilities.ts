export type Tier = "A" | "B" | "C";

export interface CapabilityResult {
  tier: Tier;
  gl: WebGL2RenderingContext | null;
}

export const MAX_DPR = 2;
export const MAX_DRAWING_BUFFER_PIXELS = 2_500_000;

/**
 * Пробует создать рендерящийся float-таргет заданного формата и проверяет
 * готовность FBO по факту (checkFramebufferStatus), а не по наличию строки
 * расширения — на части устройств расширение есть, а рендер в формат не работает.
 */
function probeRenderableFormat(gl: WebGL2RenderingContext, internalFormat: number): boolean {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  let ok = false;

  try {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  } finally {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
  }

  return ok;
}

/**
 * Определяет уровень качества один раз при инициализации сцены, до создания
 * каких-либо игровых ресурсов. Tier C означает «не создавать сцену вообще».
 */
export function detectCapabilities(canvas: HTMLCanvasElement): CapabilityResult {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  }) as WebGL2RenderingContext | null;

  if (!gl) {
    return { tier: "C", gl: null };
  }

  // Расширения нужно включить явно, даже если дальше проверяем по факту.
  gl.getExtension("EXT_color_buffer_float");
  gl.getExtension("EXT_color_buffer_half_float");
  gl.getExtension("OES_texture_float_linear");

  if (probeRenderableFormat(gl, gl.RGBA32F)) {
    return { tier: "A", gl };
  }

  if (probeRenderableFormat(gl, gl.RGBA16F)) {
    return { tier: "B", gl };
  }

  return { tier: "C", gl: null };
}

export interface DrawingBufferSize {
  width: number;
  height: number;
  dpr: number;
}

/**
 * DPR ограничен 2, но дополнительно ограничивается общее число пикселей
 * drawing buffer — на большом Retina-экране DPR 2 сам по себе может
 * превысить разумный бюджет видеопамяти.
 */
export function computeDrawingBufferSize(cssWidth: number, cssHeight: number): DrawingBufferSize {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  let width = Math.max(1, Math.round(cssWidth * dpr));
  let height = Math.max(1, Math.round(cssHeight * dpr));

  const pixels = width * height;
  if (pixels > MAX_DRAWING_BUFFER_PIXELS) {
    const scale = Math.sqrt(MAX_DRAWING_BUFFER_PIXELS / pixels);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  return { width, height, dpr };
}
