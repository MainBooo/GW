"use client"

import { motion, useReducedMotion } from "framer-motion"

const stages = [
  { title: "Campaign", text: "Оператор задаёт цель поиска и ограничения" },
  { title: "Planner", text: "Строит план: источники и поисковые запросы" },
  { title: "Lead Hunter", text: "Обходит источники и создаёт лидов" },
  { title: "Research Agent", text: "Изучает сайт и профиль компании" },
  { title: "Scoring Agent", text: "Оценивает соответствие предложению" },
  { title: "Contact Enrichment", text: "Находит контакты для первого обращения" },
]

export function PipelineAnimation() {
  const prefersReducedMotion = useReducedMotion()

  const container = {
    hidden: {},
    visible: {
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.18 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
  }

  const line = {
    hidden: { scaleX: 0 },
    visible: { scaleX: 1, transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] as const } },
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-0"
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      {stages.map((stage, index) => (
        <motion.div key={stage.title} variants={item} className="relative flex items-center lg:px-2">
          {index > 0 && (
            <motion.span
              variants={line}
              className="absolute right-full top-1/2 hidden h-px w-2 origin-right bg-gradient-to-r from-transparent to-primary/60 lg:block"
              aria-hidden="true"
            />
          )}
          <div className="grid-glow relative flex h-full w-full flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
              {index + 1}
            </div>
            <div className="text-sm font-semibold text-white">{stage.title}</div>
            <p className="text-xs leading-5 text-white/55">{stage.text}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
