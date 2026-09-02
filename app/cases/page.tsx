import type { Metadata } from "next"
import { CasesIndex } from "@/components/cases/cases-index"

export const metadata: Metadata = {
  title: "Кейсы",
  description:
    "Интерактивные WebGL-сцены: GPU-симуляция миллиона частиц, SDF ray marching со стеклом и визуализация рыночных данных. Всё построено кодом, без импортированных моделей и текстур.",
  alternates: { canonical: "/cases" },
}

export default function CasesPage() {
  return <CasesIndex />
}
