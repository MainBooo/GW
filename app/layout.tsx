import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://generationweb.dev"),
  title: "GenerationWeb — разработка SaaS-сервисов и аналитических платформ",
  description:
    "GenerationWeb проектирует и запускает SaaS-сервисы, аналитические dashboards, системы мониторинга и внутренние платформы для бизнеса.",
  keywords: [
    "разработка saas",
    "разработка mvp",
    "аналитические платформы",
    "dashboard разработка",
    "система мониторинга сайтов",
    "nextjs nestjs разработка",
  ],
  openGraph: {
    title: "GenerationWeb",
    description:
      "Разработка SaaS-сервисов, аналитических платформ и систем мониторинга.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
