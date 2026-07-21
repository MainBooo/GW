"use client"

import { AnimatePresence } from "framer-motion"
import { usePanel } from "@/lib/panel-context"
import { MobileMenuPanel } from "@/components/panels/mobile-menu-panel"
import { ServiceDetailPanel } from "@/components/panels/service-detail-panel"
import { GrowthEnginePanel } from "@/components/panels/growth-engine-panel"
import { ReputationOsPanel } from "@/components/panels/reputationos-panel"
import { ContactPanel } from "@/components/panels/contact-panel"

export function PanelRoot() {
  const { activePanel } = usePanel()

  return (
    <AnimatePresence>
      {activePanel === "menu" && <MobileMenuPanel key="menu" />}
      {activePanel === "service" && <ServiceDetailPanel key="service" />}
      {activePanel === "growth-engine" && <GrowthEnginePanel key="growth-engine" />}
      {activePanel === "reputationos" && <ReputationOsPanel key="reputationos" />}
      {activePanel === "contact" && <ContactPanel key="contact" />}
    </AnimatePresence>
  )
}
