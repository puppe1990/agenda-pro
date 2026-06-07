import { LogOut } from 'lucide-react'

import { authClient } from '#/lib/auth-client'

export const SIDEBAR_LOGOUT_LABEL = 'Sair'

export function SidebarLogoutButton() {
  return (
    <button
      type="button"
      className="app-nav-link w-full text-left"
      aria-label="Sair da conta"
      onClick={async () => {
        await authClient.signOut()
        window.location.href = '/'
      }}
    >
      <LogOut size={16} strokeWidth={2} />
      {SIDEBAR_LOGOUT_LABEL}
    </button>
  )
}
