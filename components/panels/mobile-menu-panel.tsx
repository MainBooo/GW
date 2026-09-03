"use client"

import Link from "next/link"
import { usePanel } from "@/lib/panel-context"
import { PanelShell } from "@/components/panels/panel-shell"

// Прежние пункты (#services, #growth-engine, #reputationos, #process, #contact)
// вели на секции agency-версии главной, которая заархивирована —
// git tag archive/agency-site-2026-09-02. Список приведён к тому, что
// реально существует на кинематографичной главной, тем же составом,
// что и десктопная навигация в header.tsx.
const links = [
  { href: "/cases", label: "Кейсы" },
  { href: "/saas", label: "SaaS" },
]

export function MobileMenuPanel() {
  const { closePanel, openPanel } = usePanel()

  return (
    <PanelShell side="right" title="Меню" ariaLabel="Главное меню" onClose={closePanel} widthClassName="w-full sm:w-[420px]">
      <nav className="flex flex-col gap-1" aria-label="Меню сайта">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={closePanel}
            className="rounded-2xl px-4 py-4 text-2xl font-semibold text-white/85 transition hover:bg-white/5 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => openPanel("contact")}
        className="cta-primary mt-8 w-full rounded-2xl border border-primary/30 bg-gradient-to-r from-primary to-secondary px-6 py-4 text-base font-medium text-white shadow-soft transition hover:scale-[1.01]"
      >
        Обсудить проект
      </button>

      <div className="mt-8 border-t border-white/10 pt-6 text-sm text-white/45">
        <a href="https://t.me/max92pole" target="_blank" rel="noopener noreferrer" className="transition hover:text-white/70">
          Telegram: @max92pole
        </a>
      </div>
    </PanelShell>
  )
}
