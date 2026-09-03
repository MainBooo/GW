import type { Metadata } from "next"
import { CinematicHomepage } from "@/components/cinematic/homepage"

// Прежняя главная (components/site.tsx) заархивирована целиком —
// git tag archive/agency-site-2026-09-02. Файл не удалён, просто не подключён.

const title = "WebGL и Three.js-разработка для агентств и бизнеса — GenerationWeb"
const description =
  "Интерактивные сайты, 3D/WebGL-сцены, сложная анимация и full-stack разработка. Подключение к проектам агентств или создание продукта целиком."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://generationweb.ru",
    siteName: "GenerationWeb",
    title,
    description,
    images: [{ url: "/logo/generationweb-dark.PNG", alt: "GenerationWeb" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/logo/generationweb-dark.PNG"],
  },
}

export default function HomePage() {
  return <CinematicHomepage />
}
