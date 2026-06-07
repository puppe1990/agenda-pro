// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { signOutMock } = vi.hoisted(() => ({
  signOutMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('#/lib/auth-client', () => ({
  authClient: {
    signOut: signOutMock,
  },
}))

import {
  SIDEBAR_LOGOUT_LABEL,
  SidebarLogoutButton,
} from '#/components/SidebarLogoutButton'

describe('SidebarLogoutButton', () => {
  let currentHref = 'http://localhost:3000/app/dashboard'

  beforeEach(() => {
    signOutMock.mockClear()
    currentHref = 'http://localhost:3000/app/dashboard'
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        get href() {
          return currentHref
        },
        set href(value: string) {
          currentHref = value
        },
      },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders logout action in the sidebar', () => {
    render(<SidebarLogoutButton />)

    expect(
      screen.getByRole('button', { name: 'Sair da conta' }),
    ).toBeInTheDocument()
    expect(screen.getByText(SIDEBAR_LOGOUT_LABEL)).toBeInTheDocument()
  })

  it('signs out and redirects to home', async () => {
    render(<SidebarLogoutButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledOnce()
      expect(window.location.href).toBe('/')
    })
  })
})
