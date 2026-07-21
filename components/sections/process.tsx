import { processSteps } from "@/lib/content"
import { ScrollReveal } from "@/components/effects/scroll-reveal"
import { TiltCard } from "@/components/effects/tilt-card"

export function Process() {
  return (
    <section id="process" className="container-shell py-10 sm:py-14">
      <ScrollReveal>
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Процесс разработки</h2>
        </div>
      </ScrollReveal>

      <div className="grid gap-6 lg:grid-cols-4">
        {processSteps.map((item, index) => (
          <ScrollReveal key={item.step} delay={index * 0.08}>
            <TiltCard max={4} className="group grid-glow relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/50 p-6 backdrop-blur transition-colors duration-300 hover:border-secondary/20">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/65 to-primary/60" />
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-secondary/8 opacity-70 blur-3xl" />

              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.04] text-3xl font-semibold text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  {item.step}
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/42">
                  step
                </div>
              </div>

              <h3 className="text-[28px] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-[30px]">
                {item.title}
              </h3>
              <p className="mt-5 text-[16px] leading-7 text-white/76">{item.text}</p>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
