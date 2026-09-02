"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { CASES } from "@/lib/cases-content"

/**
 * Карточки кейсов с превью-роликами. Ролики подгружаются только когда карточка
 * попала в вид, и не подгружаются вовсе при prefers-reduced-motion: иначе
 * страница тянула бы их все сразу, ничего не показывая.
 */
export function CaseCards() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const videos = Array.from(container.querySelectorAll<HTMLVideoElement>("video[data-preview-src]"))
    if (videos.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement
          if (entry.isIntersecting) {
            if (!video.src && video.dataset.previewSrc) video.src = video.dataset.previewSrc
            void video.play().catch(() => {
              /* автовоспроизведение может быть запрещено политикой браузера */
            })
          } else if (!video.paused) {
            video.pause()
          }
        }
      },
      { threshold: 0.2 },
    )

    videos.forEach((video) => observer.observe(video))
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {CASES.map((entry) => (
        <Link
          key={entry.slug}
          href={`/cases/${entry.slug}`}
          data-cursor-el
          className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition duration-300 hover:border-white/25 hover:bg-white/[0.05]"
        >
          <video
            className="aspect-[16/10] w-full bg-black object-cover"
            data-preview-src={`/cases/previews/${entry.slug}.mp4`}
            aria-label={`Превью кейса «${entry.title}»`}
            loop
            muted
            playsInline
            preload="none"
          />
          <div className="p-5">
            <h3 className="text-[15px] font-medium text-white">{entry.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{entry.tagline}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-accent transition group-hover:gap-2.5">
              Смотреть
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                <path d="M1 5h11M8.5 1.5 12 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
