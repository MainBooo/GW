import type { SceneSlug } from "@/components/cases/webgl-scene"

export interface CaseEntry {
  slug: SceneSlug
  title: string
  /** Короткая строка для карточки на главной и в списке. */
  tagline: string
  technique: string
  problem: string
  timeframe: string
  codeOnly: string
  /** Технологии, показываются чипами. */
  stack: string[]
  sceneDescription: string
  withTooltip?: boolean
}

export const CASES: CaseEntry[] = [
  {
    slug: "particles",
    title: "GPU Particle Flow",
    tagline: "Миллион частиц в поле скоростей, целиком на GPU",
    technique:
      "MRT ping-pong (позиция и скорость), curl noise, обновление и рендер целиком на GPU без обращения к CPU",
    problem:
      "Показать вычислительную графику в браузере в реальном времени: состояние частиц живёт в текстурах и никогда не читается обратно на процессор",
    timeframe: "сентябрь 2026",
    codeOnly: "Построено целиком кодом: без импортированных моделей, текстур и изображений",
    stack: ["WebGL2", "Three.js", "GLSL", "MRT", "curl noise"],
    sceneDescription:
      "Интерактивная сцена: миллион частиц движется в поле скоростей на основе curl noise. Курсор вносит возмущение. На устройствах без поддержки WebGL2 показан статичный кадр.",
  },
  {
    slug: "glass",
    title: "SDF ray marching с преломлением",
    tagline: "Стекло без геометрии и текстур — только дистанционные поля",
    technique:
      "Сферический трейсинг знаковых полей, два перехода границы, хроматическая аберрация на трёх коэффициентах, Френель по Шлику",
    problem:
      "Физически правдоподобное стекло в реальном времени: вся сцена считается во фрагментном шейдере, окружение процедурное",
    timeframe: "сентябрь 2026",
    codeOnly: "Построено целиком кодом: без импортированных моделей, текстур и HDRI",
    stack: ["WebGL2", "GLSL", "SDF", "ray marching", "ACES"],
    sceneDescription:
      "Интерактивная сцена: стеклянное тело, построенное знаковыми полями расстояния, с двойным преломлением и хроматической аберрацией. Курсор поворачивает камеру. На устройствах без поддержки WebGL2 показан статичный кадр.",
  },
  {
    slug: "market",
    title: "Визуализация рыночных данных",
    tagline: "Ландшафт объёма по 2000 реальных свечей",
    technique:
      "Процедурная геометрия в BufferGeometry: объём свечи распределяется по ценовым корзинам, свечение — по ATR, без библиотек графиков",
    problem:
      "Плотная визуализация временного ряда, которую невозможно собрать готовым чарт-компонентом",
    timeframe: "сентябрь 2026",
    codeOnly: "Построено целиком кодом: геометрия и цвет считаются из данных, без сторонних ассетов",
    stack: ["WebGL2", "Three.js", "BufferGeometry", "Binance API"],
    sceneDescription:
      "Интерактивная сцена: ландшафт объёма торгов во времени по историческим свечам BTCUSDT. Наведите курсор на рельеф, чтобы увидеть данные свечи. На устройствах без поддержки WebGL2 показан статичный кадр.",
    withTooltip: true,
  },
]

export function getCase(slug: string): CaseEntry | undefined {
  return CASES.find((entry) => entry.slug === slug)
}

export interface SaasProduct {
  name: string
  description: string
  url: string
  stack: string[]
  screenshot: string
}

export const SAAS_PRODUCTS: SaasProduct[] = [
  {
    name: "ReputationOS",
    description:
      "Управление онлайн-репутацией: отзывы с Яндекс Карт, 2ГИС и веба в едином инбоксе, AI-черновики ответов, аналитика рейтинга и тональности, мультикомпанийные workspace.",
    url: "https://reputationos.generationweb.ru",
    stack: ["NestJS", "PostgreSQL", "Redis", "BullMQ", "Next.js", "Prisma"],
    screenshot: "/cases/saas/reputationos-placeholder.webp",
  },
  {
    name: "Strategy Lab",
    description:
      "Витрина для трейдеров: тестирование торговых стратегий по крипте на исторических данных, интерактивные графики, плеер проигрывания истории (Market Replay). Услуга: разработка стратегии под заказ.",
    url: "https://strategylab.generationweb.ru",
    stack: ["Flask", "SQLite", "Binance Spot API", "Vanilla TS chart engine"],
    screenshot: "/cases/saas/strategylab-placeholder.webp",
  },
]
