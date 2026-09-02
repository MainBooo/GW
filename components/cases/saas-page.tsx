"use client"

import Image from "next/image"
import { PanelProvider } from "@/lib/panel-context"
import { Header } from "@/components/sections/header"
import { Footer } from "@/components/sections/footer"
import { PanelRoot } from "@/components/panels/panel-root"
import { SAAS_PRODUCTS } from "@/lib/cases-content"

export function SaasPage() {
  return (
    <PanelProvider>
      <main className="relative z-10 min-h-screen overflow-x-clip bg-background text-white">
        <Header />

        <div className="container-shell pt-28 sm:pt-32">
          <p className="text-[11px] uppercase tracking-[0.14em] text-accent">SaaS</p>
          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Кроме проектов делаем продукты целиком
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/60">
            Продуктовая разработка под ключ: архитектура, бэкенд, фоновые обработчики, интеграции,
            интерфейс и эксплуатация. Ниже — два собственных продукта, сделанных целиком.
          </p>
        </div>

        {SAAS_PRODUCTS.map((product) => (
          <section key={product.name} className="container-shell mt-14 border-t border-white/10 pt-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.25fr] lg:items-start">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/65">{product.description}</p>

                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 font-mono text-[13px] text-accent transition hover:gap-2.5"
                >
                  {product.url.replace("https://", "")}
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                    <path d="M1 5h11M8.5 1.5 12 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {product.stack.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-white/60"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Image
                src={product.screenshot}
                alt={`Интерфейс ${product.name}`}
                width={1200}
                height={750}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.02]"
              />
            </div>
          </section>
        ))}

        <Footer />
      </main>
      <PanelRoot />
    </PanelProvider>
  )
}
