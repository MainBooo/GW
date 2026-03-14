import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://generationweb.ru"),
  title: {
    default: "Разработка SaaS-платформ, MVP и аналитических систем на заказ | GenerationWeb",
    template: "%s | GenerationWeb",
  },
  description:
    "GenerationWeb — разработка SaaS-платформ на заказ: MVP, аналитические dashboard-системы, внутренние сервисы, системы мониторинга, API и сложный backend для бизнеса и стартапов.",
  keywords: [
    "разработка saas платформ",
    "разработка saas на заказ",
    "разработка mvp",
    "разработка аналитических систем",
    "dashboard разработка",
    "разработка внутренних систем",
    "разработка crm и личных кабинетов",
    "система мониторинга сайтов",
    "nextjs nestjs разработка",
    "разработка веб платформ",
  ],
  alternates: {
    canonical: "https://generationweb.ru",
  },
  openGraph: {
    title: "GenerationWeb — разработка SaaS-платформ и аналитических систем",
    description:
      "Разработка SaaS-платформ, MVP, dashboard-систем, внутренних сервисов и monitoring products под запуск и рост.",
    url: "https://generationweb.ru",
    siteName: "GenerationWeb",
    type: "website",
    locale: "ru_RU",
    images: [
      {
        url: "/projects/hero-main.jpeg",
        width: 1200,
        height: 630,
        alt: "GenerationWeb — разработка SaaS-платформ и аналитических систем",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GenerationWeb — разработка SaaS-платформ и аналитических систем",
    description:
      "MVP, SaaS, dashboard-системы, внутренние платформы, мониторинг и сложный backend.",
    images: ["/projects/hero-main.jpeg"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
