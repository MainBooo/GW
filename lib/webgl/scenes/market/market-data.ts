/** [openTime, open, high, low, close, volume] */
export type Candle = [number, number, number, number, number, number];

export interface MarketSnapshot {
  source: string;
  symbol: string;
  interval: string;
  fetchedAt: string;
  candleCount: number;
  candles: Candle[];
}

export interface MarketFieldOptions {
  /** Число ценовых корзин на весь видимый диапазон цен. */
  buckets: number;
  /** Окно ATR, свечей. */
  atrPeriod: number;
}

export interface MarketField {
  candleCount: number;
  buckets: number;
  /** Нормированный объём по ячейкам, ряд за рядом: index = candle * buckets + bucket. */
  cells: Float32Array;
  /** Направление свечи: +1 рост, -1 падение. */
  direction: Float32Array;
  /** Нормированный ATR(atrPeriod) в [0, 1]. */
  atr: Float32Array;
  /** Агрегированный профиль объёма по корзинам за весь период, нормирован в [0, 1]. */
  profile: Float32Array;
  /** Взвешенный по объёму центр корзин каждой свечи — ценовая траектория. */
  centroidBucket: Float32Array;
  priceMin: number;
  priceMax: number;
  /** Значение 99-го перцентиля до нормировки — для подписи в отладке. */
  clipValue: number;
}

function percentile(sorted: Float32Array, p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[idx];
}

/**
 * Строит поле объёма во времени по алгоритму из ТЗ:
 * X — индекс свечи, Z — ценовая корзина, Y — объём свечи, распределённый
 * по корзинам между её low и high; нормировка log1p + клип по 99-му перцентилю.
 */
export function buildMarketField(candles: Candle[], options: MarketFieldOptions): MarketField {
  const { buckets, atrPeriod } = options;
  const candleCount = candles.length;

  let priceMin = Infinity;
  let priceMax = -Infinity;
  for (const candle of candles) {
    if (candle[3] < priceMin) priceMin = candle[3];
    if (candle[2] > priceMax) priceMax = candle[2];
  }
  const priceSpan = Math.max(priceMax - priceMin, 1e-9);

  const cells = new Float32Array(candleCount * buckets);
  const direction = new Float32Array(candleCount);
  const profile = new Float32Array(buckets);
  const centroidBucket = new Float32Array(candleCount);

  const bucketOf = (price: number): number => {
    const t = (price - priceMin) / priceSpan;
    return Math.min(buckets - 1, Math.max(0, Math.floor(t * buckets)));
  };

  for (let i = 0; i < candleCount; i++) {
    const [, open, high, low, close, volume] = candles[i];
    direction[i] = close >= open ? 1 : -1;

    const lowBucket = bucketOf(low);
    const highBucket = bucketOf(high);
    const spanned = highBucket - lowBucket + 1;
    const share = volume / spanned;

    const rowOffset = i * buckets;
    for (let j = lowBucket; j <= highBucket; j++) {
      cells[rowOffset + j] = share;
      profile[j] += share;
    }

    centroidBucket[i] = (lowBucket + highBucket) / 2;
  }

  // log1p сжимает выбросы объёма, клип по 99-му перцентилю убирает единичные
  // пики, из-за которых весь остальной ландшафт становится плоским.
  for (let k = 0; k < cells.length; k++) {
    cells[k] = Math.log1p(cells[k]);
  }

  // Перцентиль считается по непустым ячейкам. Пустая ячейка означает, что цена
  // в эту корзину не заходила, — это отсутствие наблюдения, а не наблюдение
  // с нулевым объёмом. Их около 95%, и если включить их в выборку, порог
  // клипа падает так низко, что почти весь рельеф упирается в потолок и
  // ландшафт вырождается в плато с отвесными стенками.
  const nonEmpty: number[] = [];
  for (let k = 0; k < cells.length; k++) {
    if (cells[k] > 0) nonEmpty.push(cells[k]);
  }
  const sorted = Float32Array.from(nonEmpty).sort();
  const clipValue = Math.max(percentile(sorted, 0.99), 1e-9);
  // log1p сжимает объёмы в узкую полосу (типичный разброс — от 5.7 до 7.3),
  // поэтому одного деления на порог мало: рельеф занял бы лишь верхние 20%
  // высоты и читался бы плоским столом. Растягиваем [p01, p99] на всю высоту.
  const floorValue = percentile(sorted, 0.01);
  const span = Math.max(clipValue - floorValue, 1e-9);

  for (let k = 0; k < cells.length; k++) {
    if (cells[k] <= 0) continue;
    cells[k] = Math.min(Math.max((cells[k] - floorValue) / span, 0), 1);
  }

  let profileMax = 0;
  for (let j = 0; j < buckets; j++) {
    profile[j] = Math.log1p(profile[j]);
    if (profile[j] > profileMax) profileMax = profile[j];
  }
  if (profileMax > 0) {
    for (let j = 0; j < buckets; j++) profile[j] /= profileMax;
  }

  return {
    candleCount,
    buckets,
    cells,
    direction,
    atr: computeNormalizedAtr(candles, atrPeriod),
    profile,
    centroidBucket,
    priceMin,
    priceMax,
    clipValue,
  };
}

/** ATR по Уайлдеру (простое скользящее среднее true range), нормированный в [0, 1]. */
function computeNormalizedAtr(candles: Candle[], period: number): Float32Array {
  const n = candles.length;
  const trueRange = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const [, , high, low] = candles[i];
    if (i === 0) {
      trueRange[i] = high - low;
      continue;
    }
    const prevClose = candles[i - 1][4];
    trueRange[i] = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  }

  const atr = new Float32Array(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += trueRange[i];
    if (i >= period) sum -= trueRange[i - period];
    atr[i] = sum / Math.min(i + 1, period);
  }

  let max = 0;
  for (let i = 0; i < n; i++) if (atr[i] > max) max = atr[i];
  if (max > 0) {
    for (let i = 0; i < n; i++) atr[i] /= max;
  }
  return atr;
}
