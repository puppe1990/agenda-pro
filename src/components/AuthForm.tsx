import { useState } from 'react'

import { authClient } from '#/lib/auth-client'

type Mode = 'login' | 'signup'

export function AuthForm({ mode }: { mode: Mode }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        const result = await authClient.signUp.email({
          email,
          password,
          name,
        })
        if (result.error) {
          throw new Error(result.error.message)
        }
        window.location.href = '/onboarding'
        return
      }

      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        throw new Error(result.error.message)
      }
      window.location.href = '/app/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de autenticação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="island-shell mx-auto max-w-md rounded-2xl p-6"
    >
      <h1 className="mb-4 text-2xl font-bold">
        {mode === 'login' ? 'Entrar' : 'Criar conta'}
      </h1>
      {mode === 'signup' && (
        <>
          <label className="mb-3 block text-sm">
            Nome
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="mb-3 block text-sm">
            Nome do negócio
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Salão, clínica, consultório..."
            />
          </label>
        </>
      )}
      <label className="mb-3 block text-sm">
        E-mail
        <input
          type="email"
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="mb-4 block text-sm">
        Senha
        <input
          type="password"
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 font-semibold text-white"
      >
        {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
      </button>
    </form>
  )
}
