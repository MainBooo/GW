/**
 * Показ статичного кадра на Tier C. Источник берётся из data-атрибута и
 * присваивается только здесь: если оставить src в разметке, браузер скачает
 * изображение и тем, у кого сцена работает, — даже под display:none.
 */
export function showSceneFallback(root: HTMLElement): void {
  root.classList.add("is-fallback");

  const image = root.querySelector<HTMLImageElement>("img.scene-fallback[data-fallback-src]");
  if (!image) return;

  const src = image.dataset.fallbackSrc;
  if (!src) return;

  image.src = src;
  image.hidden = false;
}
