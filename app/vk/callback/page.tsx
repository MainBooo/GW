type Props = {
  searchParams?: {
    code?: string
    device_id?: string
    error?: string
    error_description?: string
    state?: string
  }
}

export default function VkCallbackPage({ searchParams }: Props) {
  const code = searchParams?.code ?? ''
  const deviceId = searchParams?.device_id ?? ''
  const error = searchParams?.error ?? ''
  const errorDescription = searchParams?.error_description ?? ''
  const state = searchParams?.state ?? ''

  const text = error
    ? [
        `error=${error}`,
        `error_description=${errorDescription}`,
        `state=${state}`,
      ].join('\n')
    : code
      ? [
          `code=${code}`,
          `device_id=${deviceId}`,
          `state=${state}`,
        ].join('\n')
      : 'Нет параметров code/device_id. Проверь VK ID OAuth настройки.'

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="mb-4 text-2xl font-semibold">VK ID OAuth callback</h1>
        <p className="mb-4 text-sm text-white/60">
          После авторизации VK скопируй значения <code>code=...</code> и <code>device_id=...</code>.
        </p>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
{text}
        </pre>
      </div>
    </main>
  )
}
