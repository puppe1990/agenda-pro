import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import {
  enqueueNotificationFn,
  listQueueFn,
  listTemplatesFn,
  saveTemplateFn,
} from '#/server/fns/app'

export const Route = createFileRoute('/app/whatsapp')({
  loader: async () => {
    const [templates, queue] = await Promise.all([
      listTemplatesFn(),
      listQueueFn(),
    ])
    return { templates, queue }
  },
  component: WhatsAppPage,
})

function WhatsAppPage() {
  const data = Route.useLoaderData()
  const saveTemplate = useServerFn(saveTemplateFn)
  const enqueue = useServerFn(enqueueNotificationFn)
  const [body, setBody] = useState(
    'Olá {cliente}, lembramos seu horário em {data} para {servico}.',
  )

  return (
    <section className="island-shell rounded-2xl p-6">
      <PageHeader
        title="WhatsApp"
        description="Templates, fila e deep links wa.me."
      />
      <form
        className="mb-6"
        onSubmit={async (e) => {
          e.preventDefault()
          await saveTemplate({
            data: {
              type: 'reminder',
              name: 'Lembrete padrão',
              body,
            },
          })
          window.location.reload()
        }}
      >
        <textarea
          className="mb-2 w-full rounded-xl border px-3 py-2"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 text-sm font-semibold text-white"
        >
          Salvar template
        </button>
      </form>
      <h3 className="mb-2 font-semibold">Templates</h3>
      <ul className="mb-6 space-y-2 text-sm">
        {data.templates.map((t) => (
          <li key={t.id} className="rounded-xl border bg-white/50 p-2">
            <strong>{t.name}</strong> ({t.type}) — {t.body}
          </li>
        ))}
      </ul>
      <h3 className="mb-2 font-semibold">Fila de envio</h3>
      <ul className="space-y-2 text-sm">
        {data.queue.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white/50 p-2"
          >
            <span>
              {item.status} — {item.message.slice(0, 80)}
            </span>
            {item.phone && (
              <a
                className="rounded-lg border px-2 py-1 no-underline"
                href={`https://wa.me/55${item.phone.replace(/\D/g, '')}?text=${encodeURIComponent(item.message)}`}
                target="_blank"
                rel="noreferrer"
                onClick={async () => {
                  await enqueue({
                    data: {
                      phone: item.phone!,
                      message: item.message,
                      scheduledAt: item.scheduledAt,
                    },
                  })
                }}
              >
                Enviar WhatsApp
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
