"use client"

import { Eyebrow } from "@/components/cinematic/eyebrow"

const LINKS = [
  { label: "Telegram", href: "https://t.me/max92pole" },
  { label: "GitHub", href: "https://github.com/MainBooo" },
  { label: "ReputationOS", href: "https://reputationos.generationweb.ru" },
  { label: "Strategy Lab", href: "https://strategylab.generationweb.ru" },
]

export function ContactScreen({ onOpenContact }: { onOpenContact: () => void }) {
  return (
    <div className="container-shell flex h-full w-full flex-col items-center justify-center gap-10 pt-20">
      <div className="glass-cinema mx-auto w-full max-w-2xl rounded-[28px] px-6 py-10 text-center sm:px-10 sm:py-14">
        <Eyebrow>COLLABORATION</Eyebrow>
        <h2 className="mt-4 text-balance text-[1.75rem] font-light leading-[1.15] tracking-tight text-cream sm:text-3xl lg:text-4xl">
          Нужен интерактивный сайт или сложная разработка?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-stone">
          Подключусь как WebGL/full-stack подрядчик или соберу проект целиком — от идеи и архитектуры до запуска.
        </p>

        <button
          type="button"
          onClick={onOpenContact}
          className="cta-bordeaux mt-8 rounded-2xl border border-bordeaux-light/40 bg-gradient-to-r from-bordeaux to-bordeaux-light px-8 py-4 text-[15px] font-medium text-cream shadow-soft transition hover:scale-[1.02]"
        >
          Обсудить проект
        </button>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-6">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13.5px] text-stone underline-offset-4 transition hover:text-cream hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 pb-6 text-center text-[12px] text-stone/70">
        <span>© 2026 GenerationWeb</span>
        <span className="font-mono tracking-[0.2em] text-stone/50">WebGL · Three.js · Full-stack development</span>
      </div>
    </div>
  )
}
