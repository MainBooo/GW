export type Service = {
  id: string
  index: string
  title: string
  short: string
  long: string
  bullets: string[]
}

export const services: Service[] = [
  {
    id: "ai-systems",
    index: "01",
    title: "AI-системы и AI-агенты",
    short: "Мультиагентные системы, которые исследуют, оценивают и готовят данные для принятия решений.",
    long:
      "Проектируем и разрабатываем AI-агентов и мультиагентные пайплайны: от планирования задачи до сбора данных, оценки и подготовки результата для оператора. Каждый агент — это отдельный узел с чёткой ролью, который можно наблюдать, тестировать и масштабировать независимо.",
    bullets: [
      "Планирование и оркестрация цепочек агентов",
      "Интеграция с LLM-провайдерами и fallback-логика",
      "Скоринг, классификация и обогащение данных",
      "Наблюдаемость: логи запусков, статусы, метрики",
    ],
  },
  {
    id: "saas-platforms",
    index: "02",
    title: "SaaS и внутренние бизнес-платформы",
    short: "Платформы с пользователями, ролями, биллингом и аналитикой — для рынка или для команды.",
    long:
      "Строим SaaS-продукты и внутренние платформы: систему пользователей и доступов, dashboard с фильтрами и метриками, автоматизацию процессов, интеграции с внешними сервисами. Архитектура рассчитана на рост — от первых пользователей до нагрузки продакшена.",
    bullets: [
      "Мультитенантность, роли и права доступа",
      "Биллинг, подписки, тарифные ограничения",
      "Dashboard, таблицы, фильтры, экспорт данных",
      "Очереди, фоновые задачи, интеграции",
    ],
  },
  {
    id: "web-apps",
    index: "03",
    title: "Современные веб-приложения",
    short: "Быстрые, доступные интерфейсы на Next.js с продуманной архитектурой и анимацией.",
    long:
      "Разрабатываем клиентские и серверные части современных веб-приложений на Next.js и React: производительный рендеринг, доступный интерфейс, аккуратная анимация и адаптивность на всех разрешениях — от мобильного до десктопа.",
    bullets: [
      "Next.js App Router, server components",
      "Доступность (a11y) и семантическая разметка",
      "Производительность: lazy loading, code splitting",
      "Дизайн-система и переиспользуемые компоненты",
    ],
  },
]

export const directions = ["AI-агенты", "SaaS-платформы", "Автоматизация", "Веб-приложения", "Внутренние системы", "MVP"]

export const stack = ["Next.js", "NestJS", "PostgreSQL", "Redis", "BullMQ", "Playwright", "Docker", "TypeScript"]

export const processSteps = [
  { step: "1", title: "Обсуждение задачи", text: "Уточняем цель, сценарии использования, сроки и важные ограничения." },
  { step: "2", title: "Архитектура", text: "Прорабатываю структуру проекта, БД, интерфейсы, логику API и очередей." },
  { step: "3", title: "Разработка", text: "Поэтапно собираю продукт: UI, backend, интеграции, фоновые процессы." },
  { step: "4", title: "Запуск", text: "Разворачиваю проект, настраиваю окружение и передаю рабочий результат." },
]

export const growthEngineScreens = [
  { src: "/projects/growth-engine/dashboard.png", label: "Dashboard", caption: "Сводка по кампаниям и запускам поиска" },
  { src: "/projects/growth-engine/campaigns.png", label: "Campaigns", caption: "Кампании лид-хантинга и их статусы" },
  { src: "/projects/growth-engine/leads.png", label: "Leads", caption: "Оценённые лиды со score и этапом обработки" },
  { src: "/projects/growth-engine/agent-center.png", label: "Agent Center", caption: "Статус каждого агента пайплайна в реальном времени" },
  { src: "/projects/growth-engine/analytics.png", label: "Analytics", caption: "Динамика лидов, конверсия, приоритеты" },
]

export const reputationOsScreens = [
  { src: "/projects/reputationos/inbox.jpeg", label: "Inbox", caption: "Единая лента отзывов и упоминаний из всех источников" },
  { src: "/projects/reputationos/dashboard-overview.jpeg", label: "Обзор", caption: "Сводный дашборд по компании и её репутации" },
  { src: "/projects/reputationos/dashboard-analytics.jpeg", label: "Аналитика", caption: "Рейтинг, тональность и динамика отзывов" },
  { src: "/projects/reputationos/sources-network.jpeg", label: "Источники", caption: "Карта подключённых площадок и мониторинг сети" },
  { src: "/projects/reputationos/company-overview.jpeg", label: "Компания", caption: "Профиль компании и настройки мониторинга" },
]
