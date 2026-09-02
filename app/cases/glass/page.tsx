import type { Metadata } from "next"
import { CasePage } from "@/components/cases/case-page"
import { CASES, getCase } from "@/lib/cases-content"

const entry = getCase("glass")!
const index = CASES.findIndex((c) => c.slug === "glass")
const prev = CASES[(index - 1 + CASES.length) % CASES.length]
const next = CASES[(index + 1) % CASES.length]

export const metadata: Metadata = {
  title: entry.title,
  description: entry.problem,
  alternates: { canonical: "/cases/glass" },
}

export default function Page() {
  return <CasePage entry={entry} prev={prev} next={next} />
}
