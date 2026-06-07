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
  { to: '/app/configuracoes', label: 'Configurações', icon: Settings },
]

const mobileNav = nav.slice(0, 5)

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <div className="min-h-screen bg-[var(--page-bg)] pb-20 text-[var(--sea-ink)] md:pb-6">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5 md:py-6">
        <aside className="app-sidebar hidden w-60 shrink-0 p-3 md:block">
          <div className="mb-5 flex items-center gap-2.5 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--lagoon-deep)] text-xs font-bold text-white">
              AP
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--sea-ink)]">
                Agenda Pro
              </p>
              <p className="text-[0.65rem] font-medium text-[var(--sea-ink-soft)]">
                Painel
              </p>
            </div>
          </div>
          <nav className="flex flex-col gap-0.5">
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
