import type { Metadata } from "next"
import { ReputationOsCase } from "@/components/cases/reputationos-case"

export const metadata: Metadata = {
  title: "ReputationOS",
  description:
    "Кейс: мультиарендная платформа управления онлайн-репутацией — отзывы с Яндекс Карт, 2ГИС и веба в едином инбоксе, AI-черновики ответов, аналитика рейтинга и тональности.",
  alternates: { canonical: "/cases/reputationos" },
}

export default function Page() {
  return <ReputationOsCase />
}
