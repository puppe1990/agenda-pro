import { Link } from '@tanstack/react-router'
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
    <div className="auth-layout">
      <div className="auth-panel">
        <div className="auth-brand">
          <div className="auth-brand-mark">AB</div>
          <p className="island-kicker">Agenda Bem</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="island-shell rounded-2xl p-6 sm:p-7"
        >
          <h1 className="page-title mb-1">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h1>
          <p className="page-subtitle mb-5">
            {mode === 'login'
              ? 'Acesse seu painel de agendamentos.'
              : 'Comece grátis em menos de 2 minutos.'}
          </p>
          {mode === 'signup' && (
            <>
              <label className="mb-3">
                Nome
                <input
                  className="mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="mb-3">
                Nome do negócio
                <input
                  className="mt-1.5"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Salão, clínica, consultório..."
                />
              </label>
            </>
          )}
          <label className="mb-3">
            E-mail
            <input
              type="email"
              className="mt-1.5"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="mb-4">
            Senha
            <input
              type="password"
              className="mt-1.5"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="demo-alert demo-alert-danger mb-4 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
          <p className="mt-4 text-center text-sm text-[var(--sea-ink-soft)]">
            {mode === 'login' ? (
              <>
                Não tem conta?{' '}
                <Link to="/signup" className="font-semibold no-underline">
                  Criar conta
                </Link>
              </>
            ) : (
              <>
                Já tem conta?{' '}
                <Link to="/login" className="font-semibold no-underline">
                  Entrar
                </Link>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  )
}
