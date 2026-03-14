import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://generationweb.ru"),

  title: {
    default: "Разработка SaaS платформ и MVP — GenerationWeb",
    template: "%s — GenerationWeb",
  },

  description:
    "Разработка SaaS-платформ, MVP, аналитических dashboard-систем, систем мониторинга и внутренних бизнес-сервисов. Full-stack разработка, backend, frontend и deploy.",

  keywords: [
    "разработка SaaS",
    "разработка SaaS платформ",
    "разработка MVP",
    "разработка dashboard",
    "разработка аналитических систем",
    "разработка внутренних сервисов",
    "full-stack разработка",
    "backend frontend deploy",
    "monitoring systems",
    "dashboard systems",
    "GenerationWeb",
  ],

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://generationweb.ru",
    siteName: "GenerationWeb",
    title: "Разработка SaaS платформ и MVP — GenerationWeb",
    description:
      "Разработка SaaS-платформ, аналитических dashboard-систем, систем мониторинга и внутренних бизнес-сервисов. Full-stack разработка и запуск продукта.",
    images: [
      {
        url: "/logo/generationweb-dark.PNG",
        alt: "GenerationWeb",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Разработка SaaS платформ и MVP — GenerationWeb",
    description:
      "Разработка SaaS-платформ, аналитических dashboard-систем, систем мониторинга и внутренних бизнес-сервисов.",
    images: ["/logo/generationweb-dark.PNG"],
  },

  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
    shortcut: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
