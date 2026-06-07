import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import { authClient } from '#/lib/auth-client'
import {
  deleteClientDataFn,
  exportClientDataFn,
  listClientsFn,
  seedDemoFn,
} from '#/server/fns/app'

export const Route = createFileRoute('/app/configuracoes')({
  loader: async () => listClientsFn({ data: {} }),
  component: ConfiguracoesPage,
})

function ConfiguracoesPage() {
  const clients = Route.useLoaderData()
  const exportClient = useServerFn(exportClientDataFn)
  const deleteClient = useServerFn(deleteClientDataFn)
  const seedDemo = useServerFn(seedDemoFn)
  const [lgpdMessage, setLgpdMessage] = useState('')

  return (
    <section className="island-shell rounded-2xl p-6">
      <PageHeader
        title="Configurações"
        description="Conta, LGPD, demo e preferências."
      />
      <div className="space-y-4 text-sm">
        {import.meta.env.DEV && (
          <div className="rounded-xl border bg-white/50 p-4">
            <h3 className="font-semibold">Ambiente de demo</h3>
            <button
              type="button"
              className="mt-2 rounded-xl border px-3 py-2"
              onClick={async () => {
                const result = await seedDemo()
                setLgpdMessage(
                  `Demo criada. Acesse ${result.bookingPath ?? '/book/studio-demo'}`,
                )
              }}
            >
              Seed studio-demo
            </button>
          </div>
        )}
        <div className="rounded-xl border bg-white/50 p-4">
          <h3 className="font-semibold">LGPD — dados do cliente</h3>
          <p className="mt-1 text-[var(--sea-ink-soft)]">
            Exporte ou exclua dados pessoais mediante solicitação.
          </p>
          <ul className="mt-3 space-y-2">
            {clients.slice(0, 5).map((client) => (
              <li
                key={client.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border px-2 py-1"
              >
                <span>{client.name}</span>
                <button
                  type="button"
                  className="rounded border px-2 py-0.5"
                  onClick={async () => {
                    const payload = await exportClient({
                      data: { clientId: client.id },
                    })
                    const blob = new Blob([JSON.stringify(payload, null, 2)], {
                      type: 'application/json',
                    })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `cliente-${client.id}.json`
                    a.click()
                    setLgpdMessage(`Exportado: ${client.name}`)
                  }}
                >
                  Exportar JSON
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-0.5 text-red-700"
                  onClick={async () => {
                    if (
                      !window.confirm(
                        `Excluir permanentemente os dados de ${client.name}?`,
                      )
                    ) {
                      return
                    }
                    await deleteClient({ data: { clientId: client.id } })
                    setLgpdMessage(`Excluído: ${client.name}`)
                    window.location.reload()
                  }}
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
          {lgpdMessage && (
            <p className="mt-2 text-[var(--sea-ink-soft)]">{lgpdMessage}</p>
          )}
        </div>
        <div className="rounded-xl border bg-white/50 p-4">
          <h3 className="font-semibold">Sessão</h3>
          <button
            type="button"
            className="mt-2 rounded-xl border px-3 py-2"
            onClick={async () => {
              await authClient.signOut()
              window.location.href = '/'
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </section>
  )
}
