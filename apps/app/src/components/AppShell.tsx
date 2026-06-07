import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Stethoscope,
  Users,
  Wallet,
} from 'lucide-react'

const nav = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/agenda', label: 'Agenda', icon: Calendar },
  { to: '/app/clientes', label: 'Clientes', icon: Users },
  { to: '/app/servicos', label: 'Serviços', icon: ClipboardList },
  { to: '/app/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/app/equipe', label: 'Equipe', icon: Users },
  { to: '/app/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { to: '/app/anamnese', label: 'Anamnese', icon: Stethoscope },
  { to: '/app/relatorios', label: 'Relatórios', icon: FileText },
]

const settingsNav = [
  { to: '/app/configuracoes', label: 'Configurações', icon: Settings },
]

const mobileNav = [...nav, ...settingsNav].slice(0, 5)

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <div className="min-h-screen bg-[var(--page-bg)] pb-20 text-[var(--sea-ink)] md:pb-6">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5 md:py-6">
        <aside className="app-sidebar hidden w-60 shrink-0 overflow-hidden md:block">
          {/* Brand section */}
          <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-4 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--lagoon-deep)] text-sm font-bold text-white shadow-sm">
              AB
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--sea-ink)]">
                Agenda Bem
              </p>
              <p className="text-[0.65rem] font-medium text-[var(--sea-ink-soft)]">
                Painel operacional
              </p>
            </div>
          </div>

          {/* Main nav */}
          <nav className="flex flex-col gap-0.5 p-2 pb-0">
            {nav.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`app-nav-link ${active ? 'is-active' : ''}`}
                >
                  <Icon size={16} strokeWidth={active ? 2.25 : 2} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Settings separator */}
          <div className="border-t border-[var(--line)] p-2 pt-2">
            {settingsNav.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`app-nav-link ${active ? 'is-active' : ''}`}
                >
                  <Icon size={16} strokeWidth={active ? 2.25 : 2} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <nav
        className="app-mobile-nav md:hidden"
        aria-label="Navegação principal"
      >
        {mobileNav.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`app-mobile-nav-link ${active ? 'is-active' : ''}`}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 2} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
