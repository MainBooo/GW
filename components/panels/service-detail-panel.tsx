"use client"

import { services } from "@/lib/content"
import { usePanel } from "@/lib/panel-context"
import { PanelShell } from "@/components/panels/panel-shell"

export function ServiceDetailPanel() {
  const { closePanel, meta } = usePanel()
  const service = services.find((s) => s.id === meta?.serviceId) ?? services[0]

  return (
    <PanelShell side="right" title={service.title} ariaLabel={`Услуга: ${service.title}`} onClose={closePanel} widthClassName="w-full sm:w-[520px]">
      <div className="text-xs font-medium uppercase tracking-[0.22em] text-white/35">{service.index}</div>
      <p className="mt-4 text-[17px] leading-8 text-white/80">{service.long}</p>

      <div className="mt-8 space-y-3">
        {service.bullets.map((bullet) => (
          <div key={bullet} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-[15px] leading-6 text-white/80">
            <span className="mt-[3px] text-secondary">✓</span>
            <span>{bullet}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={closePanel}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
      >
        ← Все направления
      </button>
    </PanelShell>
  )
}
