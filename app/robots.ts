import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://generationweb.ru/sitemap.xml",
    host: "https://generationweb.ru",
  }
}
