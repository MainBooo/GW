/**
 * Скользящее окно времени кадра. Решение о просадке качества принимается
 * только по полному окну (не по одному дёрганому кадру) и не чаще, чем раз
 * в cooldown — чтобы не колебаться между уровнями качества.
 */
export class FrameTimeMonitor {
  private samples: number[] = [];
  private lastDowngradeAt = 0;

  constructor(
    private readonly windowSize = 60,
    private readonly slowThresholdMs = 20,
    private readonly cooldownSeconds = 2,
  ) {}

  push(deltaSeconds: number): void {
    this.samples.push(deltaSeconds * 1000);
    if (this.samples.length > this.windowSize) this.samples.shift();
  }

  private averageMs(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }

  /** true не чаще, чем раз в cooldownSeconds, и только когда окно заполнено. */
  shouldDowngrade(elapsedSeconds: number): boolean {
    if (this.samples.length < this.windowSize) return false;
    if (elapsedSeconds - this.lastDowngradeAt < this.cooldownSeconds) return false;
    if (this.averageMs() <= this.slowThresholdMs) return false;
    this.lastDowngradeAt = elapsedSeconds;
    this.samples = [];
    return true;
  }
}
