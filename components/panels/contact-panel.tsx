"use client"

import { useState, type FormEvent } from "react"
import { usePanel } from "@/lib/panel-context"
import { PanelShell } from "@/components/panels/panel-shell"

export function ContactPanel() {
  const { closePanel } = usePanel()
  const [name, setName] = useState("")
  const [task, setTask] = useState("")
  const [contact, setContact] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const lines = [
      name ? `Имя: ${name}` : null,
      contact ? `Как связаться: ${contact}` : null,
      task ? `Задача: ${task}` : "Хочу обсудить проект",
    ].filter(Boolean)

    const url = `https://t.me/max92pole?text=${encodeURIComponent(lines.join("\n"))}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <PanelShell side="bottom" title="Обсудим проект" ariaLabel="Форма связи" onClose={closePanel} widthClassName="w-full">
      <div className="mx-auto max-w-2xl">
        <p className="text-white/65">
          Заполните форму — откроется Telegram с готовым сообщением. Отвечаю обычно в течение дня.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Имя
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как к вам обращаться"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/30 outline-none transition focus:border-primary/50"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/70">
            Контакт для связи
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Telegram, email или телефон"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/30 outline-none transition focus:border-primary/50"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/70 sm:col-span-2">
            Что нужно сделать
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              rows={4}
              placeholder="AI-агент, SaaS-платформа, внутренняя система или веб-приложение"
              className="resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/30 outline-none transition focus:border-primary/50"
            />
          </label>

          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button
              type="submit"
              className="cta-primary rounded-2xl border border-primary/30 bg-gradient-to-r from-primary to-secondary px-6 py-3.5 text-base font-medium text-white shadow-soft transition hover:scale-[1.01]"
            >
              Написать в Telegram
            </button>
            <a
              href="https://t.me/max92pole"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/50 transition hover:text-white/80"
            >
              или напишите напрямую: @max92pole
            </a>
          </div>
        </form>
      </div>
    </PanelShell>
  )
}
