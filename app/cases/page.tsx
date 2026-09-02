import type { Metadata } from "next"
import { CasesIndex } from "@/components/cases/cases-index"

export const metadata: Metadata = {
  title: "Кейсы",
  description:
    "Кейсы GenerationWeb: работающие продукты и интерактивные 3D-сцены. 3D-сцены и модели создаются специально под наши продукты — в основе каждого кейса реальные интерфейсы, данные и работающие системы.",
  alternates: { canonical: "/cases" },
}

export default function CasesPage() {
  return <CasesIndex />
}
