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

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--sea-ink)]">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="island-shell hidden w-64 shrink-0 rounded-2xl p-4 md:block">
          <p className="mb-4 text-sm font-semibold text-[var(--lagoon-deep)]">
            Agenda Pro
          </p>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm no-underline transition ${
                    active
                      ? 'bg-[rgba(79,184,178,0.18)] text-[var(--lagoon-deep)]'
                      : 'text-[var(--sea-ink-soft)] hover:bg-white/60'
                  }`}
                >
                  <Icon size={16} />
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
    </div>
  )
}
