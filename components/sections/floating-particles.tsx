"use client"

import { useIsMobile } from "@/lib/use-media-query"

const particlesDesktop = [
  { left: "6%", top: "14%", size: 7, delay: "0s", duration: "16s" },
  { left: "14%", top: "66%", size: 5, delay: "2s", duration: "18s" },
  { left: "22%", top: "28%", size: 4, delay: "1s", duration: "14s" },
  { left: "31%", top: "58%", size: 6, delay: "4s", duration: "19s" },
  { left: "39%", top: "18%", size: 5, delay: "3s", duration: "15s" },
  { left: "48%", top: "70%", size: 4, delay: "6s", duration: "17s" },
  { left: "57%", top: "24%", size: 7, delay: "2.5s", duration: "20s" },
  { left: "66%", top: "62%", size: 5, delay: "1.5s", duration: "16s" },
  { left: "74%", top: "16%", size: 4, delay: "5s", duration: "13s" },
  { left: "82%", top: "48%", size: 6, delay: "3.5s", duration: "18s" },
  { left: "90%", top: "24%", size: 5, delay: "0.5s", duration: "15s" },
  { left: "70%", top: "78%", size: 4, delay: "7s", duration: "21s" },
]

export function FloatingParticles() {
  const isMobile = useIsMobile()

  // Reduced motion is disabled purely in CSS to avoid a hydration mismatch here.
  const particles = isMobile ? particlesDesktop.slice(0, 5) : particlesDesktop

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="floating-particle"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}
