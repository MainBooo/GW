import { stack } from "@/lib/content"
import { ScrollReveal } from "@/components/effects/scroll-reveal"

export function TechStack() {
  return (
    <section id="tech" className="container-shell py-10">
      <ScrollReveal>
        <div className="grid-glow relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/50 p-8 backdrop-blur sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Технологический стек</h2>
          <p className="mt-3 max-w-2xl text-white/65">Инструменты, на которых реально построены наши продукты — включая Growth Engine и ReputationOS.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {stack.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                {item}
              </span>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
