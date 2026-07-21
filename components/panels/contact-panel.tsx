"use client"

import { useState, type FormEvent } from "react"
import { usePanel } from "@/lib/panel-context"
import { PanelShell } from "@/components/panels/panel-shell"

const PROJECT_TYPES = ["AI-агент / мультиагентная система", "SaaS-платформа", "Внутренняя система", "Веб-приложение", "Другое"]

const SYSTEM_TAGS = ["CHANNEL OPEN", "PROJECT INPUT READY", "RESPONSE TIME: AS SOON AS POSSIBLE"]

type SubmitState = "idle" | "sent"

export function ContactPanel() {
  const { closePanel } = usePanel()
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0])
  const [task, setTask] = useState("")
  const [budget, setBudget] = useState("")
  const [state, setState] = useState<SubmitState>("idle")
  const [lastUrl, setLastUrl] = useState<string | null>(null)

  const buildUrl = () => {
    const lines = [
      name ? `Имя: ${name}` : null,
      contact ? `Как связаться: ${contact}` : null,
      `Тип проекта: ${projectType}`,
      task ? `Описание: ${task}` : "Хочу обсудить проект",
      budget ? `Ориентировочный бюджет: ${budget}` : null,
    ].filter(Boolean)

    return `https://t.me/max92pole?text=${encodeURIComponent(lines.join("\n"))}`
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const url = buildUrl()
    setLastUrl(url)

    // `noopener` (kept intentionally — the opened tab shouldn't be able to reach back
    // into window.opener) makes window.open() return null on success too, so its
    // return value can't distinguish "opened" from "popup blocked". We can't claim
    // confirmed delivery either way, so the next screen stays honestly hedged and
    // always offers the manual link rather than asserting a success we can't verify.
    window.open(url, "_blank", "noopener,noreferrer")
    setState("sent")
  }

  if (state === "sent") {
    return (
      <PanelShell side="bottom" title="Обсудим проект" ariaLabel="Форма связи" onClose={closePanel} widthClassName="w-full">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-3 py-10 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">REQUEST RECEIVED</div>
          <h3 className="text-2xl font-semibold text-white">Мы с вами свяжемся</h3>
          <p className="text-white/60">
            Telegram должен был открыться в новой вкладке с готовым сообщением. Отправьте его — отвечаю обычно в течение дня.
          </p>
          {lastUrl && (
            <a
              href={lastUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/70 underline-offset-4 hover:underline"
            >
              Вкладка не открылась? Открыть Telegram вручную →
            </a>
          )}
          <button
            type="button"
            onClick={closePanel}
            className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/80 transition hover:bg-white/10"
          >
            Закрыть
          </button>
        </div>
      </PanelShell>
    )
  }

  return (
    <PanelShell side="bottom" title="Обсудим проект" ariaLabel="Форма связи" onClose={closePanel} widthClassName="w-full">
      <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary/70">GENERATION REQUEST</div>
          <h3 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
            Опишите систему,
            <br />
            которую нужно создать.
          </h3>

          <div className="mt-6 flex flex-col gap-2">
            {SYSTEM_TAGS.map((tag) => (
              <div key={tag} className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                <span className="h-1 w-1 rounded-full bg-secondary" />
                {tag}
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-white/45">
            Заполните форму — откроется Telegram с готовым сообщением.{" "}
            <a href="https://t.me/max92pole" target="_blank" rel="noopener noreferrer" className="text-white/70 underline-offset-4 hover:underline">
              Или напишите напрямую: @max92pole
            </a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
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
            Telegram, телефон или email
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Как с вами связаться"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/30 outline-none transition focus:border-primary/50"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/70 sm:col-span-2">
            Тип проекта
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-primary/50"
            >
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type} className="bg-background text-white">
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/70 sm:col-span-2">
            Краткое описание
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              rows={4}
              placeholder="Что нужно сделать и зачем"
              className="resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/30 outline-none transition focus:border-primary/50"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/70 sm:col-span-2">
            Ориентировочный бюджет
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Например: 300–600 тыс. ₽"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/30 outline-none transition focus:border-primary/50"
            />
          </label>

          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button
              type="submit"
              className="cta-primary rounded-2xl border border-primary/30 bg-gradient-to-r from-primary to-secondary px-6 py-3.5 text-base font-medium text-white shadow-soft transition hover:scale-[1.01]"
            >
              ОТПРАВИТЬ ЗАПРОС
            </button>
          </div>
        </form>
      </div>
    </PanelShell>
  )
}
