import type { Metadata } from "next"
import { LabPage } from "@/components/lab/lab-page"

const title = "WebGL Lab — интерактивные 3D-эксперименты GenerationWeb"
const description =
  "Интерактивные эксперименты GenerationWeb: 3D-логотипы, процедурная графика и продуктовые WebGL-сцены."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/lab" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://generationweb.ru/lab",
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

export default function Page() {
  return <LabPage />
}
