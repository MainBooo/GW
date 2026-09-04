"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePanel } from "@/lib/panel-context"
import { PanelShell } from "@/components/panels/panel-shell"

// Тот же состав, что и в desktop-навигации header.tsx: на главной — якоря по
// четырём экранам, на остальных страницах (/cases, /saas) — прежние ссылки,
// чтобы между ними не пропала навигация.
const HOME_LINKS = [
  { href: "#services", label: "Услуги" },
  { href: "#products", label: "Продукты" },
  { href: "/lab", label: "Lab" },
  { href: "#contact", label: "Контакт" },
]

const OTHER_LINKS = [
  { href: "/cases", label: "Кейсы" },
  { href: "/saas", label: "SaaS" },
]

export function MobileMenuPanel() {
  const { closePanel, openPanel } = usePanel()
  const onHome = usePathname() === "/"
  const links = onHome ? HOME_LINKS : OTHER_LINKS

  return (
    <PanelShell id="mobile-menu-panel" side="right" title="Меню" ariaLabel="Главное меню" onClose={closePanel} widthClassName="w-full sm:w-[420px]">
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
        className="cta-bordeaux mt-8 w-full rounded-2xl border border-bordeaux-light/40 bg-gradient-to-r from-bordeaux to-bordeaux-light px-6 py-4 text-base font-medium text-cream shadow-soft transition hover:scale-[1.01]"
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
