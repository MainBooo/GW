import type { MetadataRoute } from "next"
import { CASES } from "@/lib/cases-content"

const BASE = "https://generationweb.ru"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    { url: BASE, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/cases`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    ...CASES.map((entry) => ({
      url: `${BASE}/cases/${entry.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${BASE}/saas`, lastModified, changeFrequency: "monthly", priority: 0.8 },
  ]
}
