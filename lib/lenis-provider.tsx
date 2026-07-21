"use client"

import { useEffect } from "react"
import Lenis from "lenis"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

// Module-level so anchor clicks anywhere in the tree can drive the same Lenis
// instance instead of falling back to a native jump that Lenis doesn't know about.
export const lenisRef: { current: Lenis | null } = { current: null }

// Keys whose default browser handling moves the scroll position directly
// (native scrollTo), same category of "Lenis wasn't driving this" jump as a
// hash link or history navigation.
const NATIVE_SCROLL_KEYS = new Set(["Home", "End", "PageUp", "PageDown", " ", "Spacebar"])

function resyncToNativeScroll() {
  // One rAF: let the browser's native scroll (hash jump, history restore, the
  // key's default action) land first, then adopt it as truth.
  requestAnimationFrame(() => {
    // lenis.resize() sets animatedScroll/targetScroll to the current real
    // scrollY, cancelling whatever stale target Lenis was still easing
    // towards -- without this a jump that lands while Lenis is mid-animation
    // gets fought on the next rAF tick as Lenis eases back to its old target.
    lenisRef.current?.resize()
    ScrollTrigger.refresh()
  })
}

function scrollToHash(hash: string, immediate: boolean) {
  if (!hash || hash === "#") return
  const target = document.getElementById(hash.slice(1))
  if (!target) return
  const lenis = lenisRef.current
  if (lenis) {
    lenis.scrollTo(target, { immediate, onComplete: () => ScrollTrigger.refresh() })
  } else {
    target.scrollIntoView({ behavior: immediate ? "auto" : "smooth" })
  }
}

export function LenisProvider() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) return

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
    })
    lenisRef.current = lenis

    lenis.on("scroll", ScrollTrigger.update)

    const tick = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // In-page anchor clicks (header nav, mobile menu, CTA links) default to an
    // instant native jump that bypasses Lenis entirely, leaving it to fight the
    // new position on its next tick. Routing them through lenis.scrollTo keeps
    // Lenis authoritative for the whole scroll instead of just picking up the
    // pieces afterwards.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      const anchor = (event.target as HTMLElement)?.closest?.('a[href^="#"]')
      if (!anchor) return
      const hash = anchor.getAttribute("href") ?? ""
      if (!hash || hash === "#" || !document.getElementById(hash.slice(1))) return
      event.preventDefault()
      window.history.pushState(null, "", hash)
      scrollToHash(hash, false)
    }
    document.addEventListener("click", onClick)

    // Anything that moves the page without going through lenis.scrollTo --
    // a hash typed into the URL, browser back/forward, the position the
    // browser restores on reload, Home/End/Page Down -- leaves both Lenis and
    // every ScrollTrigger's cached progress stale relative to where the page
    // actually ended up. Resyncing brings the active scene's visible state
    // back in line with the real scroll position instead of whatever it was
    // when the jump happened.
    const onHashChange = () => resyncToNativeScroll()
    const onPopState = () => resyncToNativeScroll()
    const onKeyDown = (event: KeyboardEvent) => {
      if (NATIVE_SCROLL_KEYS.has(event.key)) resyncToNativeScroll()
    }
    window.addEventListener("hashchange", onHashChange)
    window.addEventListener("popstate", onPopState)
    window.addEventListener("keydown", onKeyDown)

    // Two rAFs: one for this frame's layout to settle, one for GSAP's own
    // ScrollTrigger bounds (created by each scene's own effect, mounting in
    // the same batch) to exist before we ask it to jump/refresh.
    if (window.location.hash) {
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToHash(window.location.hash, true)))
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()))
    }

    return () => {
      document.removeEventListener("click", onClick)
      window.removeEventListener("hashchange", onHashChange)
      window.removeEventListener("popstate", onPopState)
      window.removeEventListener("keydown", onKeyDown)
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return null
}
