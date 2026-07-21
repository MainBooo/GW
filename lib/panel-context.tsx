"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

export type PanelId = "menu" | "service" | "growth-engine" | "reputationos" | "contact"

type PanelMeta = { serviceId?: string } | null

type HistoryPanelState = { gwPanel: PanelId; gwMeta: PanelMeta } | null

type PanelContextValue = {
  activePanel: PanelId | null
  meta: PanelMeta
  openPanel: (id: PanelId, meta?: PanelMeta) => void
  closePanel: () => void
}

const PanelContext = createContext<PanelContextValue | null>(null)

export function PanelProvider({ children }: { children: ReactNode }) {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null)
  const [meta, setMeta] = useState<PanelMeta>(null)
  const hasPushedRef = useRef(false)

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const state = event.state as HistoryPanelState
      if (state?.gwPanel) {
        setActivePanel(state.gwPanel)
        setMeta(state.gwMeta ?? null)
        hasPushedRef.current = true
      } else {
        setActivePanel(null)
        setMeta(null)
        hasPushedRef.current = false
      }
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const openPanel = useCallback((id: PanelId, nextMeta?: PanelMeta) => {
    setActivePanel(id)
    setMeta(nextMeta ?? null)

    const state: HistoryPanelState = { gwPanel: id, gwMeta: nextMeta ?? null }
    if (hasPushedRef.current) {
      window.history.replaceState(state, "")
    } else {
      window.history.pushState(state, "")
      hasPushedRef.current = true
    }
  }, [])

  const closePanel = useCallback(() => {
    if (hasPushedRef.current) {
      window.history.back()
    } else {
      setActivePanel(null)
      setMeta(null)
    }
  }, [])

  const value = useMemo(
    () => ({ activePanel, meta, openPanel, closePanel }),
    [activePanel, meta, openPanel, closePanel],
  )

  return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>
}

export function usePanel() {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error("usePanel must be used within PanelProvider")
  return ctx
}
