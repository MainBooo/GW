import type { Metadata } from "next"
import "./globals.css"

const title = "WebGL и Three.js-разработка для агентств и бизнеса — GenerationWeb"
const description =
  "Интерактивные сайты, 3D/WebGL-сцены, сложная анимация и full-stack разработка. Подключение к проектам агентств или создание продукта целиком. Работающие production-системы: ReputationOS, Strategy Lab."

export const metadata: Metadata = {
  metadataBase: new URL("https://generationweb.ru"),

  title: {
    default: title,
    template: "%s — GenerationWeb",
  },

  description,

  alternates: {
    canonical: "/",
    languages: {
      "ru-RU": "/",
    },
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },

  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://generationweb.ru",
    siteName: "GenerationWeb",
    title,
    description,
    images: [
      {
        url: "/logo/generationweb-dark.PNG",
        alt: "GenerationWeb",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "GenerationWeb",
    description: "AI-агенты, SaaS-платформы, внутренние системы и веб-приложения.",
    images: ["/logo/generationweb-dark.PNG"],
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "GenerationWeb",
  description,
  url: "https://generationweb.ru",
  image: "https://generationweb.ru/logo/generationweb-dark.PNG",
  areaServed: "RU",
  sameAs: ["https://t.me/max92pole"],
  makesOffer: [
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Интерактивные сайты и WebGL/Three.js-сцены" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Full-stack разработка сайтов и цифровых продуктов" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "SaaS и AI-системы" } },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
