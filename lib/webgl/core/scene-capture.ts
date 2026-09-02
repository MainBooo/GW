/**
 * Единый контракт для scripts/capture.ts: детерминированно продвинуть сцену
 * на dtSeconds (без опоры на реальное время) и отрендерить кадр. Включается
 * страницей сцены только при ?capture или ?debug в query — на обычной
 * загрузке ничего не подключается.
 */
export interface SceneCaptureHook {
  advanceFrame(dtSeconds: number): void;
  render(): void;
}

declare global {
  interface Window {
    __sceneCapture?: SceneCaptureHook;
  }
}

/**
 * Только ?capture. В этом режиме сцена не крутит собственный RAF-цикл —
 * шаги задаёт скрипт захвата, иначе реальное время дублировало бы их
 * и кадр переставал быть детерминированным.
 * ?debug сюда намеренно не входит: панель отладки нужна на живой сцене.
 */
export function wantsCaptureHook(search: string): boolean {
  return new URLSearchParams(search).has("capture");
}

export function wantsDebugPanel(search: string): boolean {
  return new URLSearchParams(search).has("debug");
}
