import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '#/components/PageHeader'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/app/configuracoes')({
  component: ConfiguracoesPage,
})

function ConfiguracoesPage() {
  return (
    <section className="island-shell rounded-2xl p-6">
      <PageHeader
        title="Configurações"
        description="Conta, LGPD e preferências."
      />
      <div className="space-y-4 text-sm">
        <div className="rounded-xl border bg-white/50 p-4">
          <h3 className="font-semibold">LGPD</h3>
          <p className="mt-1 text-[var(--sea-ink-soft)]">
            Exporte ou solicite exclusão dos dados do cliente mediante suporte.
          </p>
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
