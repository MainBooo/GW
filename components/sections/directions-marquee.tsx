import { directions } from "@/lib/content"

function Group({ prefix }: { prefix: string }) {
  return (
    <div className="gw-marquee-group">
      {directions.map((item, i) => (
        <span key={prefix + "-" + i} className="gw-marquee-pill">
          {item}
        </span>
      ))}
    </div>
  )
}

export function DirectionsMarquee() {
  return (
    <section className="mt-16 border-y border-white/10 py-6 sm:mt-20" aria-label="Направления работы">
      <div className="gw-marquee-shell">
        <div className="gw-marquee-track">
          <Group prefix="a" />
          <Group prefix="b" />
          <Group prefix="c" />
        </div>
      </div>
    </section>
  )
}
