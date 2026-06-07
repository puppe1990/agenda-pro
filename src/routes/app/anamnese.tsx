import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import {
  listAnamnesisFormsFn,
  listClientsFn,
  saveAnamnesisFormFn,
  saveAnamnesisRecordFn,
} from '#/server/fns/app'

export const Route = createFileRoute('/app/anamnese')({
  loader: async () => {
    const [forms, clients] = await Promise.all([
      listAnamnesisFormsFn(),
      listClientsFn({ data: {} }),
    ])
    return { forms, clients }
  },
  component: AnamnesePage,
})

function AnamnesePage() {
  const data = Route.useLoaderData()
  const saveForm = useServerFn(saveAnamnesisFormFn)
  const saveRecord = useServerFn(saveAnamnesisRecordFn)
  const [formName, setFormName] = useState('Ficha padrão')

  const defaultFields = JSON.stringify([
    { id: 'alergia', label: 'Possui alergias?', type: 'boolean' },
    { id: 'medicacao', label: 'Usa medicação contínua?', type: 'text' },
    { id: 'observacao', label: 'Observações', type: 'text' },
  ])

  return (
    <section className="island-shell rounded-2xl p-6">
      <PageHeader
        title="Anamnese"
        description="Formulários e histórico por cliente."
      />
      <form
        className="mb-6 flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          await saveForm({
            data: { name: formName, fieldsJson: defaultFields },
          })
          window.location.reload()
        }}
      >
        <input
          className="rounded-xl border px-3 py-2"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 text-sm font-semibold text-white"
        >
          Criar formulário
        </button>
      </form>
      <ul className="space-y-3 text-sm">
        {data.forms.map((form) => (
          <li key={form.id} className="rounded-xl border bg-white/50 p-3">
            <p className="font-semibold">{form.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.clients.slice(0, 3).map((client) => (
                <button
                  key={client.id}
                  type="button"
                  className="rounded-lg border px-2 py-1"
                  onClick={async () => {
                    await saveRecord({
                      data: {
                        clientId: client.id,
                        formId: form.id,
                        responsesJson: JSON.stringify({
                          alergia: false,
                          medicacao: 'Nenhuma',
                          observacao: 'Primeira consulta',
                        }),
                      },
                    })
                  }}
                >
                  Registrar para {client.name}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
