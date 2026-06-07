import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'

import { authClient } from '#/lib/auth-client'
import { ensureOrganizationFn } from '#/server/fns/app'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
})

function OnboardingPage() {
  const ensureOrg = useServerFn(ensureOrganizationFn)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const session = await authClient.getSession()
      const user = session.data?.user
      if (!user) {
        throw redirect({ to: '/login' })
      }
      await ensureOrg({
        data: {
          userId: user.id,
          userName: user.name,
          organizationName: name,
        },
      })
      window.location.href = '/app/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar organização')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-wrap px-4 py-14">
      <form
        onSubmit={onSubmit}
        className="island-shell mx-auto max-w-md rounded-2xl p-6"
      >
        <h1 className="mb-2 text-2xl font-bold">Configure seu negócio</h1>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          Informe o nome que seus clientes reconhecem.
        </p>
        <input
          className="mb-4 w-full rounded-xl border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Studio Bella"
          required
        />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 font-semibold text-white"
        >
          {loading ? 'Salvando...' : 'Continuar'}
        </button>
      </form>
    </main>
  )
}
