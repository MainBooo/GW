"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { usePanel } from "@/lib/panel-context"

type NavItem = { href: string; label: string; external?: boolean }

// Пункты с href, начинающимся не с "#", ведут на отдельные страницы. Их нельзя
// передавать в document.querySelector — "/cases" не является валидным
// селектором и роняет вызов с SyntaxError.
const NAV_ITEMS: NavItem[] = [
  { href: "#services", label: "Услуги" },
  { href: "/cases", label: "Кейсы", external: true },
  { href: "/saas", label: "SaaS", external: true },
  { href: "#process", label: "Процесс" },
  { href: "#contact", label: "Контакты" },
]

const isAnchor = (item: NavItem) => item.href.startsWith("#")

export function Header() {
  const { openPanel } = usePanel()
  const [scrolled, setScrolled] = useState(false)
  const [activeHref, setActiveHref] = useState("#top")
  const pathname = usePathname()
  const onHome = pathname === "/"

  // Вне главной якорные пункты должны вести на главную к нужной секции,
  // иначе клик по «Услуги» со страницы кейса не делает ничего.
  const resolveHref = (item: NavItem) => (isAnchor(item) && !onHome ? `/${item.href}` : item.href)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const sections = NAV_ITEMS.filter(isAnchor)
      .map((item) => document.querySelector(item.href))
      .filter((el): el is Element => el !== null)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHref(`#${entry.target.id}`)
          }
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4 sm:pt-6">
      <div
        data-cursor-el
        className={`flex w-full max-w-[880px] items-center justify-between gap-4 rounded-full border px-4 py-2.5 transition-all duration-500 ease-out-soft sm:px-6 ${
          scrolled
            ? "border-white/10 bg-background/70 shadow-glow backdrop-blur-xl"
            : "border-white/5 bg-transparent backdrop-blur-0"
        }`}
      >
        <Link href={onHome ? "#top" : "/"} className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/logo/generationweb.svg"
            alt="GenerationWeb"
            width={30}
            height={30}
            className="rounded-lg"
          />
          <span className="hidden text-sm font-semibold tracking-tight text-white sm:inline">GenerationWeb</span>
        </Link>

        <nav className="hidden items-center gap-1 text-[13px] text-white/70 lg:flex" aria-label="Основная навигация">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={resolveHref(item)}
              className={`relative rounded-full px-3.5 py-2 transition hover:bg-white/[0.06] hover:text-white ${
                activeHref === item.href || pathname === item.href ? "text-white" : ""
              }`}
            >
              {item.label}
              {(activeHref === item.href || pathname === item.href) && (
                <span className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-secondary via-accent to-primary" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openPanel("contact")}
            className="hidden rounded-full border border-primary/30 bg-gradient-to-r from-primary to-secondary px-4 py-2 text-[13px] font-medium text-white shadow-soft transition hover:scale-[1.03] sm:inline-flex"
          >
            Обсудить проект
          </button>

          <button
            type="button"
            onClick={() => openPanel("menu")}
            aria-label="Открыть меню"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
          >
            <svg width="16" height="12" viewBox="0 0 18 14" fill="none" aria-hidden="true">
              <path d="M1 1H17M1 7H17M1 13H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
