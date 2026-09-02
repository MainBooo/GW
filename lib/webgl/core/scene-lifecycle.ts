/** Освобождение всех ресурсов сцены. Возвращается точкой входа сцены. */
export type SceneDisposer = () => void;

export interface SceneCallbacks {
  /** Обычный кадр анимации. deltaSeconds уже ограничен сверху. */
  onFrame: (deltaSeconds: number, elapsedSeconds: number) => void;
  /** Один статичный кадр — используется при prefers-reduced-motion и по requestRender(). */
  onStaticFrame?: () => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  /** Полное освобождение GPU-ресурсов: FBO, текстуры, геометрия, материалы, программы, рендерер. */
  onDispose: () => void;
}

const MAX_DELTA_SECONDS = 0.25;

/**
 * Общий контроллер жизненного цикла для всех WebGL-сцен сайта:
 * - пауза вне вида (IntersectionObserver)
 * - пауза в фоновой вкладке (visibilitychange)
 * - корректная остановка/возобновление вокруг bfcache (pagehide/pageshow)
 * - webglcontextlost/restored
 * - prefers-reduced-motion: без непрерывного RAF, но ручной рендер по требованию
 * - dispose при реальном уходе со страницы (не bfcache)
 */
export class SceneLifecycle {
  private raf = 0;
  private running = false;
  private disposed = false;
  private lastTime = 0;
  private intersecting = false;
  private pageVisible = document.visibilityState === "visible";
  private readonly reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  private reducedMotion = this.reducedMotionQuery.matches;
  private readonly io: IntersectionObserver;
  private readonly canvas: HTMLCanvasElement;
  private readonly callbacks: SceneCallbacks;

  constructor(canvas: HTMLCanvasElement, callbacks: SceneCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onPageHide = this.onPageHide.bind(this);
    this.onPageShow = this.onPageShow.bind(this);
    this.onContextLost = this.onContextLost.bind(this);
    this.onContextRestored = this.onContextRestored.bind(this);
    this.onReducedMotionChange = this.onReducedMotionChange.bind(this);
    this.tick = this.tick.bind(this);

    this.io = new IntersectionObserver(
      (entries) => {
        this.intersecting = entries[entries.length - 1]?.isIntersecting ?? false;
        this.syncRunning();
      },
      { threshold: 0 },
    );
    this.io.observe(this.canvas);

    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("pagehide", this.onPageHide);
    window.addEventListener("pageshow", this.onPageShow);
    this.canvas.addEventListener("webglcontextlost", this.onContextLost, false);
    this.canvas.addEventListener("webglcontextrestored", this.onContextRestored, false);
    this.reducedMotionQuery.addEventListener("change", this.onReducedMotionChange);

    if (this.reducedMotion) {
      this.callbacks.onStaticFrame?.();
    } else {
      this.syncRunning();
    }
  }

  /** Вызывается сценой после ручного взаимодействия, когда reduced-motion активен. */
  requestRender(): void {
    if (this.disposed || !this.reducedMotion) return;
    this.callbacks.onStaticFrame?.();
  }

  private onReducedMotionChange(): void {
    this.reducedMotion = this.reducedMotionQuery.matches;
    if (this.reducedMotion) {
      this.stop();
      this.callbacks.onStaticFrame?.();
    } else {
      this.syncRunning();
    }
  }

  private onVisibilityChange(): void {
    this.pageVisible = document.visibilityState === "visible";
    this.syncRunning();
  }

  private onPageHide(event: PageTransitionEvent): void {
    this.stop();
    if (!event.persisted) {
      // Не bfcache — страница действительно выгружается, освобождаем GPU-ресурсы.
      this.dispose();
    }
  }

  private onPageShow(): void {
    this.syncRunning();
  }

  private onContextLost(event: Event): void {
    event.preventDefault();
    this.stop();
    this.callbacks.onContextLost?.();
  }

  private onContextRestored(): void {
    this.callbacks.onContextRestored?.();
    this.syncRunning();
  }

  private syncRunning(): void {
    if (this.disposed || this.reducedMotion) return;
    const shouldRun = this.intersecting && this.pageVisible;
    if (shouldRun && !this.running) this.start();
    if (!shouldRun && this.running) this.stop();
  }

  private start(): void {
    if (this.running || this.disposed) return;
    this.running = true;
    this.lastTime = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  private stop(): void {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private tick(now: number): void {
    if (!this.running) return;
    if (this.lastTime === 0) this.lastTime = now;
    const deltaSeconds = Math.min((now - this.lastTime) / 1000, MAX_DELTA_SECONDS);
    this.lastTime = now;
    this.callbacks.onFrame(deltaSeconds, now / 1000);
    this.raf = requestAnimationFrame(this.tick);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.io.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("pagehide", this.onPageHide);
    window.removeEventListener("pageshow", this.onPageShow);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost, false);
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored, false);
    this.reducedMotionQuery.removeEventListener("change", this.onReducedMotionChange);
    this.callbacks.onDispose();
  }
}
