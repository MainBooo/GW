import type { Metadata } from "next"
import { SaasPage } from "@/components/cases/saas-page"

export const metadata: Metadata = {
  title: "SaaS-продукты",
  description:
    "Собственные SaaS-продукты GenerationWeb: ReputationOS — управление онлайн-репутацией, Strategy Lab — тестирование торговых стратегий. Разработка продуктов под ключ.",
  alternates: { canonical: "/saas" },
}

export default function Page() {
  return <SaasPage />
}
