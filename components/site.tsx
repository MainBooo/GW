import Image from "next/image"
import TypedServices from "./typed-services"

const offers = [
  {
    title: "MVP запуск",
    price: "от 290 000 ₽",
    timeline: "1–2 недели",
    audience: ["стартапов", "проверки гипотезы", "первого запуска"],
    items: [
      "Быстрый запуск продукта с понятной структурой",
      "Личный кабинет, лендинг или базовый dashboard",
      "Форма заявок, API и база данных",
      "Основа для дальнейшего масштабирования",
    ],
    cta: "Обсудить MVP",
    featured: false,
  },
  {
    title: "SaaS-платформа",
    price: "от 790 000 ₽",
    timeline: "2–4 недели",
    audience: ["SaaS-продуктов", "внутренних систем", "сервисов с ростом"],
    items: [
      "Система пользователей, ролей и доступов",
      "Dashboard, таблицы, фильтры и аналитика",
      "Автоматизация процессов и интеграции",
      "Запуск на VPS или в облаке",
    ],
    cta: "Обсудить SaaS",
    featured: true,
    badge: "Самый популярный",
  },
  {
    title: "Сложная система",
    price: "от 1,9 млн ₽",
    timeline: "4+ недели",
    audience: ["аналитических платформ", "monitoring systems", "сложных backend-задач"],
    items: [
      "Мониторинг, аналитика и crawling",
      "Высоконагруженная backend-логика",
      "Архитектура под рост продукта",
      "Поддержка и развитие после релиза",
    ],
    cta: "Обсудить систему",
    featured: false,
  },
]

const types = [
  {
    title: "SaaS-платформы",
    text: "Онлайн-сервисы с личными кабинетами, биллингом, API и автоматизацией процессов.",
  },
  {
    title: "Аналитические dashboards",
    text: "Платформы визуализации данных, отчёты, фильтры, метрики и графики для команды и клиентов.",
  },
  {
    title: "Системы мониторинга",
    text: "Отслеживание сайтов, цен, страниц, событий и изменений с уведомлениями и историей.",
  },
  {
    title: "Внутренние инструменты",
    text: "CRM, панели управления, кабинеты для сотрудников, автоматизация бизнес-процессов.",
  },
]

const cases = [
  {
    title: "Quant Trading Platform",
    description:
      "Платформа тестирования торговых стратегий с историческими симуляциями, параметрами запуска и аналитикой эффективности стратегий.",
    image: "/projects/hero-top.jpeg",
    link: "https://alfaflow.generationweb.ru",
    domain: "alfaflow.generationweb.ru",
  },
  {
    title: "Competitor Intelligence Platform",
    description:
      "SaaS-платформа мониторинга сайтов конкурентов: отслеживание страниц, обнаружение изменений и аналитика активности рынка.",
    image: "/projects/hero-main.jpeg",
    link: "https://competitor.generationweb.ru",
    domain: "competitor.generationweb.ru",
  },
  {
    title: "Analytics Dashboard",
    description:
      "Интерактивная аналитическая dashboard-система для мониторинга данных, KPI, метрик и бизнес-показателей в реальном времени.",
    image: "/projects/hero-bottom.jpeg",
    link: "https://dashboard.generationweb.ru",
    domain: "dashboard.generationweb.ru",
  },
]

const stack = ["Next.js", "NestJS", "PostgreSQL", "Redis", "BullMQ", "Playwright", "Docker", "TypeScript"]

const marqueeItems = [...stack, ...stack, ...stack]

function TechMarquee() {
  const items = [
    "Next.js",
    "NestJS",
    "PostgreSQL",
    "Redis",
    "BullMQ",
    "Playwright",
    "Docker",
    "TypeScript",
  ]

  const renderGroup = (prefix: string) => (
    <div className="gw-marquee-group">
      {items.map((item, i) => (
        <span key={prefix + "-" + i} className="gw-marquee-pill">
          {item}
        </span>
      ))}
    </div>
  )

  return (
    <section className="mt-20 border-y border-white/10 py-6">
      <div className="gw-marquee-shell">
        <div className="gw-marquee-track">
          {renderGroup("a")}
          {renderGroup("b")}
          {renderGroup("c")}
        </div>
      </div>
    </section>
  )
}

function FloatingParticles() {
  const particles = [
    { left: "6%", top: "14%", size: 7, delay: "0s", duration: "16s" },
    { left: "14%", top: "66%", size: 5, delay: "2s", duration: "18s" },
    { left: "22%", top: "28%", size: 4, delay: "1s", duration: "14s" },
    { left: "31%", top: "58%", size: 6, delay: "4s", duration: "19s" },
    { left: "39%", top: "18%", size: 5, delay: "3s", duration: "15s" },
    { left: "48%", top: "70%", size: 4, delay: "6s", duration: "17s" },
    { left: "57%", top: "24%", size: 7, delay: "2.5s", duration: "20s" },
    { left: "66%", top: "62%", size: 5, delay: "1.5s", duration: "16s" },
    { left: "74%", top: "16%", size: 4, delay: "5s", duration: "13s" },
    { left: "82%", top: "48%", size: 6, delay: "3.5s", duration: "18s" },
    { left: "90%", top: "24%", size: 5, delay: "0.5s", duration: "15s" },
    { left: "70%", top: "78%", size: 4, delay: "7s", duration: "21s" },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="floating-particle"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `particleFloat ${p.duration} ease-in-out ${p.delay} infinite`,
            WebkitAnimation: `particleFloat ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  )
}

function HeroShowcase() {
  return (
    <div className="relative mx-auto h-[520px] w-full max-w-[900px] sm:h-[600px] lg:h-[760px] lg:max-w-[940px]">
      <div className="absolute left-[14%] top-[6%] h-[180px] w-[180px] rounded-full bg-cyan-400/10 blur-3xl sm:h-[220px] sm:w-[220px]" />
      <div className="absolute right-[12%] top-[4%] h-[220px] w-[220px] rounded-full bg-violet-500/20 blur-3xl sm:h-[280px] sm:w-[280px]" />
      <div className="absolute bottom-[18%] left-[26%] h-[180px] w-[260px] rounded-full bg-blue-500/12 blur-3xl sm:h-[220px] sm:w-[380px]" />

      <div
        className="absolute left-[24%] top-[8%] z-[5] w-[58%] opacity-90 sm:left-[18%] sm:top-[7%] sm:w-[58%]"
        style={{
          transform: "perspective(2200px) rotateY(-10deg) rotateX(3deg) scale(0.94) translateY(8px)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="overflow-hidden rounded-[24px] border border-violet-400/25 bg-[#0b0f1f]/70 shadow-[0_16px_60px_rgba(70,60,255,0.22),0_0_20px_rgba(100,120,255,0.12)] backdrop-blur will-change-transform sm:rounded-[32px]">
          <Image
            src="/projects/hero-top.jpeg"
            alt="Hero top"
            width={1600}
            height={900}
            className="w-full object-cover"
          />
        </div>
      </div>

      <div
        className="absolute left-[4%] top-[23%] z-[30] w-[92%] sm:left-[2%] sm:top-[24%] sm:w-[86%]"
        style={{
          transform: "perspective(2200px) rotateY(-8deg) rotateX(2deg) translateZ(40px)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="overflow-hidden rounded-[28px] border border-violet-400/35 bg-[#0b0f1f]/82 shadow-[0_30px_120px_rgba(70,60,255,0.45),0_0_36px_rgba(100,120,255,0.18)] backdrop-blur will-change-transform sm:rounded-[36px]">
          <Image
            src="/projects/hero-main.jpeg"
            alt="Hero main"
            width={1600}
            height={900}
            priority
            className="w-full object-cover"
          />
        </div>
      </div>

      <div
        className="absolute left-[10%] top-[50%] z-[20] w-[82%] sm:left-[8%] sm:top-[58%] sm:w-[78%] lg:left-[10%] lg:top-[46%] lg:w-[74%]"
        style={{
          transform: "perspective(2200px) rotateY(-9deg) rotateX(2deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="overflow-hidden rounded-[24px] border border-violet-400/25 bg-[#0b0f1f]/78 shadow-[0_20px_80px_rgba(70,60,255,0.35),0_0_24px_rgba(100,120,255,0.14)] backdrop-blur will-change-transform sm:rounded-[30px]">
          <Image
            src="/projects/hero-bottom.jpeg"
            alt="Hero bottom"
            width={1600}
            height={900}
            className="w-full object-cover"
          />
        </div>
      </div>
    </div>
  )
}

export default function Site() {
  return (
    <main className="overflow-x-hidden bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="container-shell flex h-20 items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-3">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 shadow-soft">
              <Image
                src="/logo/generationweb.svg"
                alt="GenerationWeb"
                width={44}
                height={44}
                className="rounded-xl"
              />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">GenerationWeb</div>
              <div className="text-sm text-white/60">SaaS & Data Platforms</div>
</div>
</a>


          <nav className="hidden items-center gap-8 text-sm text-white/80 md:flex">
            <a href="#services" className="transition hover:text-white">Услуги</a>
            <a href="#cases" className="transition hover:text-white">Кейсы</a>
            <a href="#offers" className="transition hover:text-white">Форматы работы</a>
            <a href="#contact" className="transition hover:text-white">Контакты</a>
          </nav>

          <a
            href="#contact"
            className="cta-primary rounded-2xl border border-blue-400/30 bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:scale-[1.02]"
          >
            Обсудить проект
          </a>
        </div>
      </header>

      <section id="top" className="hero-section relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="hero-animated-gradient absolute inset-0 opacity-90" />
        <FloatingParticles />

        <div className="relative container-shell grid min-h-[calc(100vh-80px)] items-center gap-10 py-12 lg:grid-cols-[0.94fr_1.06fr] lg:gap-12 lg:py-20">
          <div className="max-w-[720px]">
            <div className="mb-5 inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-5 py-2.5 text-sm text-blue-100">
              Разработка SaaS-платформ, MVP и внутренних систем под запуск и рост
            </div>

            <h1 className="max-w-[760px] text-[44px] font-semibold leading-[0.96] tracking-[-0.05em] sm:text-[56px] lg:text-[72px] xl:text-[84px]">
              Разработка SaaS-платформ, MVP и аналитических систем на заказ
            </h1>

            <p className="mt-6 max-w-[760px] text-[17px] leading-[1.6] text-white/74 sm:mt-8 sm:text-[20px] lg:text-[22px]">
              Проектирую и запускаю веб-платформы для стартапов и бизнеса: SaaS-сервисы, личные кабинеты,
              аналитические dashboard-системы, системы мониторинга, API, фоновые задачи и внутренние инструменты.
            </p>

            <div className="mt-5 text-[15px] sm:text-base">
              <TypedServices />
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/70">
              {["SaaS", "аналитика", "мониторинг", "внутренние платформы", "MVP"].map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#contact"
                className="cta-primary rounded-2xl border border-blue-400/30 bg-gradient-to-r from-blue-500 to-violet-500 px-7 py-4 text-base font-medium text-white shadow-soft transition hover:scale-[1.02]"
              >
                Обсудить проект
              </a>
              <a
                href="#cases"
                className="rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-base font-medium text-white/85 transition hover:bg-white/10"
              >
                Посмотреть кейсы
              </a>
            </div>
          </div>

          <HeroShowcase />
        </div>
      </section>

      <TechMarquee />

      <section id="services" className="container-shell py-8 sm:py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Типы проектов</h2>
            <p className="mt-3 max-w-2xl text-white/65">Фокус на проектах, где важны продуктовая логика, архитектура, надёжный backend и понятный интерфейс.</p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          
{types.map((item, index) => {
  const accents = [
    {
      glow: "hover:shadow-[0_20px_60px_rgba(0,220,255,0.18)]",
      border: "hover:border-cyan-300/30",
      icon: "bg-cyan-400/15",
      gradient: "via-cyan-400/80"
    },
    {
      glow: "hover:shadow-[0_20px_60px_rgba(150,120,255,0.18)]",
      border: "hover:border-violet-300/30",
      icon: "bg-violet-400/15",
      gradient: "via-violet-400/80"
    },
    {
      glow: "hover:shadow-[0_20px_60px_rgba(255,170,90,0.18)]",
      border: "hover:border-orange-300/30",
      icon: "bg-orange-400/15",
      gradient: "via-orange-400/80"
    },
    {
      glow: "hover:shadow-[0_20px_60px_rgba(120,200,255,0.18)]",
      border: "hover:border-blue-300/30",
      icon: "bg-blue-400/15",
      gradient: "via-blue-400/80"
    }
  ]

  const a = accents[index % accents.length]

  return (
    <div
      key={item.title}
      className={`group section-card grid-glow relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 ${a.glow} ${a.border}`}
    >
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${a.gradient} to-transparent`} />

      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 ${a.icon} text-lg text-white`}>
          ✦
        </div>

        <div className="text-xs font-medium uppercase tracking-[0.22em] text-white/28">
          0{index + 1}
        </div>
      </div>

      <h3 className="text-[28px] font-semibold leading-[1.06] tracking-[-0.03em] text-white sm:text-[30px]">
        {item.title}
      </h3>

      <p className="mt-5 text-[17px] leading-8 text-white/76">
        {item.text}
      </p>

      <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/58">
        Product architecture
      </div>
    </div>
  )
})}

        </div>
      </section>

      <section className="container-shell py-10">
        <div className="section-card grid-glow overflow-hidden p-8 sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Что входит в разработку</h2>
              <p className="mt-4 max-w-2xl text-white/68">
                От первого экрана и схемы базы данных до запуска на VPS или в облаке. Можно зайти как с идеи,
                так и на стадии, когда уже нужен сильный технический исполнитель под MVP, SaaS-платформу или внутреннюю систему.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-white/80 sm:grid-cols-2">
              {[
                "Архитектура и структура БД",
                "Frontend на Next.js",
                "Backend API на NestJS",
                "Очереди и фоновые задачи",
                "Интеграции и парсинг",
                "Деплой и запуск на VPS",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="cases" className="container-shell py-10 sm:py-14">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Примеры разработанных платформ</h2>
          <p className="mt-3 max-w-2xl text-white/65">Реальные интерфейсы и демо-проекты, которые показывают уровень UI, архитектуры, backend-логики и продуктового мышления.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {cases.map((project) => (
            <a
              key={project.title}
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <article className="section-card grid-glow overflow-hidden transition-transform duration-300 group-hover:scale-[1.01]">
                <Image src={project.image} alt={project.title} width={1200} height={760} className="h-56 w-full object-cover object-top" />
                <div className="p-6">
                  <h3 className="text-2xl font-semibold leading-tight">{project.title}</h3>
                  <p className="mt-4 text-base leading-7 text-white/68">{project.description}</p>
                  <div className="mt-4 inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs text-blue-300 transition group-hover:border-blue-300/30 group-hover:text-blue-200">
                    {project.domain}
                  </div>
                  <div className="mt-4 text-sm font-medium text-blue-400 transition group-hover:text-blue-300">
                    Открыть демо →
                  </div>
                </div>
              </article>
            </a>
          ))}
        </div>

        </section>

      <section className="container-shell py-10">
        <div className="section-card grid-glow p-8 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Технологический стек</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {stack.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="offers" className="container-shell py-10 sm:py-14">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Форматы работы</h2>
          <p className="mt-3 max-w-2xl text-white/65">
            Можно стартовать с MVP, полноценной SaaS-платформы или сложной системы аналитики и мониторинга.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {offers.map((offer) => (
            <div
              key={offer.title}
              className={[
                "section-card grid-glow relative overflow-hidden p-7 shadow-[0_10px_40px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(37,99,235,0.14)]",
                offer.featured
                  ? "border-violet-400/40 bg-gradient-to-b from-violet-500/10 to-transparent shadow-[0_24px_80px_rgba(110,80,255,0.18)] lg:-translate-y-2"
                  : "",
              ].join(" ")}
            >
              {offer.featured && (
                <div className="mb-5 inline-flex rounded-full border border-violet-300/35 bg-violet-400/18 px-4 py-1.5 text-xs font-semibold tracking-tight text-violet-50 shadow-[0_0_28px_rgba(140,110,255,0.22)]">
                  {offer.badge}
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold sm:text-[30px]">{offer.title}</h3>
                  <p className="mt-2 text-sm uppercase tracking-[0.24em] text-white/45">{offer.timeline}</p>
                </div>

                <div
                  className={[
                    "whitespace-nowrap rounded-2xl border px-4 py-2 text-sm font-semibold tracking-tight shadow-[0_0_20px_rgba(59,130,246,0.10)]",
                    offer.featured
                      ? "border-violet-300/35 bg-violet-400/18 text-violet-50 shadow-[0_0_28px_rgba(140,110,255,0.22)]"
                      : "border-blue-400/30 bg-blue-500/12 text-blue-100",
                  ].join(" ")}
                >
                  {offer.price}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-4">
                <div className="text-sm text-white/48">Подходит для</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {offer.audience.map((entry) => (
                    <span
                      key={entry}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/78"
                    >
                      {entry}
                    </span>
                  ))}
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-[15px] leading-7 text-white/78 sm:text-base">
                {offer.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-[5px] text-cyan-300">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 space-y-3">
                <a
                  href="https://t.me/max92pole"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    "inline-flex w-full items-center justify-center rounded-2xl border px-5 py-3.5 text-base font-medium text-white transition",
                    offer.featured
                      ? "border-violet-300/35 bg-gradient-to-r from-blue-500 to-violet-500 shadow-soft hover:scale-[1.01]"
                      : "border-blue-400/20 bg-blue-400/10 hover:bg-blue-400/15",
                  ].join(" ")}
                >
                  {offer.cta} →
                </a>

                <div className="text-sm text-white/45">
                  Подходит для запуска с понятным объёмом работ и возможностью дальнейшего развития.
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-sm text-white/45">
          Большинство проектов попадает во второй вариант. Точная стоимость зависит от задач, ролей, интеграций и объёма логики.
        </div>
      </section>

      <section className="container-shell py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-4">
          {[
            ["1", "Обсуждение задачи", "Уточняем цель, сценарии использования, сроки и важные ограничения."],
            ["2", "Архитектура", "Прорабатываю структуру проекта, БД, интерфейсы, логику API и очередей."],
            ["3", "Разработка", "Поэтапно собираю продукт: UI, backend, интеграции, фоновые процессы."],
            ["4", "Запуск", "Разворачиваю проект, настраиваю окружение и передаю рабочий результат."],
          ].map(([step, title, text]) => (
            <div
              key={step}
              className="group section-card grid-glow relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:shadow-[0_20px_60px_rgba(46,173,255,0.12)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/65 to-violet-400/60" />
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-400/8 blur-3xl opacity-70" />

              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.04] text-3xl font-semibold text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  {step}
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/42">
                  step
                </div>
              </div>

              <h3 className="text-[30px] font-semibold leading-[1.04] tracking-[-0.03em] text-white sm:text-[32px]">
                {title}
              </h3>

              <p className="mt-5 text-[17px] leading-8 text-white/76">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="container-shell py-12 sm:py-16">
        <div className="section-card grid-glow overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-4xl">Обсудим ваш проект</h2>
            <p className="mt-5 text-lg leading-8 text-white/72">
              Напишите в Telegram, чтобы обсудить разработку SaaS-платформы, MVP, dashboard-системы или внутреннего сервиса. Сориентирую по срокам, стоимости и архитектуре решения.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="https://t.me/max92pole"
                className="cta-primary rounded-2xl border border-blue-400/30 bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-4 text-base font-medium shadow-soft transition hover:scale-[1.02]"
              >
                Написать в Telegram
              </a>
              <a
                href="#cases"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base font-medium text-white/85 transition hover:bg-white/10"
              >
                Посмотреть кейсы
              </a>
            </div>
            <div className="mt-8 text-sm text-white/45">Основной контакт для быстрых заявок: Telegram</div>
          </div>
        </div>
      </section>

      <footer className="container-shell pb-10 pt-4 text-sm text-white/45">
        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>© 2026 GenerationWeb</div>
          <div>Разработка SaaS-платформ, MVP и аналитических систем</div>
        </div>
      </footer>
    </main>
  )
}
