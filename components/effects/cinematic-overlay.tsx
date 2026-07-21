export function CinematicOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden="true">
      <div className="absolute inset-0 cinematic-grid" />
      <div className="absolute inset-0 cinematic-vignette" />
      <div className="absolute inset-0 cinematic-grain" />
    </div>
  )
}
