// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { useRouterStateMock } = vi.hoisted(() => ({
  useRouterStateMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string
    children: React.ReactNode
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet" />,
  useRouterState: (options?: {
    select?: (state: {
      location: { pathname: string }
      isLoading: boolean
    }) => unknown
  }) => {
    const state = {
      location: { pathname: useRouterStateMock() },
      isLoading: false,
    }
    return options?.select ? options.select(state) : state
  },
}))

vi.mock('#/lib/auth-client', () => ({
  authClient: {
    signOut: vi.fn().mockResolvedValue(undefined),
  },
}))

import { AppShell } from '#/components/AppShell'

describe('AppShell mobile navigation', () => {
  beforeEach(() => {
    useRouterStateMock.mockReturnValue('/app/dashboard')
    document.body.style.overflow = ''
  })

  afterEach(() => {
    cleanup()
    document.body.style.overflow = ''
  })

  it('shows primary shortcuts and a Mais action on mobile', () => {
    render(<AppShell />)

    const mobileNav = screen.getByRole('navigation', {
      name: 'Navegação principal',
    })

    expect(
      within(mobileNav).getByRole('link', { name: /Dashboard/i }),
    ).toBeInTheDocument()
    expect(
      within(mobileNav).getByRole('link', { name: /Agenda/i }),
    ).toBeInTheDocument()
    expect(
      within(mobileNav).getByRole('link', { name: /Clientes/i }),
    ).toBeInTheDocument()
    expect(
      within(mobileNav).getByRole('link', { name: /Serviços/i }),
    ).toBeInTheDocument()
    expect(
      within(mobileNav).getByRole('button', { name: /Mais/i }),
    ).toBeInTheDocument()
  })

  it('reveals overflow routes inside the Mais menu', () => {
    render(<AppShell />)

    const mobileNav = screen.getByRole('navigation', {
      name: 'Navegação principal',
    })
    fireEvent.click(within(mobileNav).getByRole('button', { name: /Mais/i }))

    const overflowNav = screen.getByRole('navigation', {
      name: 'Outras seções',
    })

    expect(
      within(overflowNav).getByRole('link', { name: /Financeiro/i }),
    ).toBeInTheDocument()
    expect(
      within(overflowNav).getByRole('link', { name: /Equipe/i }),
    ).toBeInTheDocument()
    expect(
      within(overflowNav).getByRole('link', { name: /WhatsApp/i }),
    ).toBeInTheDocument()
    expect(
      within(overflowNav).getByRole('link', { name: /Anamnese/i }),
    ).toBeInTheDocument()
    expect(
      within(overflowNav).getByRole('link', { name: /Relatórios/i }),
    ).toBeInTheDocument()
    expect(
      within(overflowNav).getByRole('link', { name: /Configurações/i }),
    ).toBeInTheDocument()
    const mobileMenu = screen.getByRole('dialog', { name: 'Mais opções' })

    expect(
      within(mobileMenu).getByRole('button', { name: 'Sair da conta' }),
    ).toBeInTheDocument()
  })

  it('highlights Mais when the current route is in the overflow menu', () => {
    useRouterStateMock.mockReturnValue('/app/whatsapp')

    render(<AppShell />)

    const mobileNav = screen.getByRole('navigation', {
      name: 'Navegação principal',
    })

    expect(
      within(mobileNav).getByRole('button', { name: /Mais/i }),
    ).toHaveClass('is-active')
  })
})
