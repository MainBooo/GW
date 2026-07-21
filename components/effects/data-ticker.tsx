const EVENTS = [
  "AI AGENT ONLINE",
  "PIPELINE READY",
  "DATA SOURCE CONNECTED",
  "RESEARCH STARTED",
  "LEAD SCORED",
  "CONTACT FOUND",
  "REVIEW RECEIVED",
  "AI DRAFT GENERATED",
  "DEPLOYMENT COMPLETE",
]

const SEPARATORS = ["◇", "+", "→", "[OK]"]

function TickerGroup({ prefix }: { prefix: string }) {
  return (
    <div className="flex shrink-0 items-center">
      {EVENTS.map((event, i) => (
        <span key={`${prefix}-${i}`} className="flex shrink-0 items-center gap-6 whitespace-nowrap px-6">
          <span className="text-white/70">{event}</span>
          <span className="text-secondary/60">{SEPARATORS[i % SEPARATORS.length]}</span>
          <span className="text-white/25">{String(i + 1).padStart(3, "0")}</span>
        </span>
      ))}
    </div>
  )
}

export function DataTicker() {
  return (
    <div
      className="relative z-10 border-y border-white/[0.06] bg-background/40 py-3 backdrop-blur-sm"
      aria-label="Системные события"
    >
      <div className="gw-marquee-shell">
        <div className="flex w-max animate-[gwTickerMove_34s_linear_infinite] font-mono text-[11px] uppercase tracking-[0.15em]">
          <TickerGroup prefix="a" />
          <TickerGroup prefix="b" />
        </div>
      </div>
    </div>
  )
}
