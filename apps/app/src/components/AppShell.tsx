import { useEffect, useRef } from 'react'
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

import { SidebarLogoutButton } from '#/components/SidebarLogoutButton'

function RouteProgressBar() {
  const isLoading = useRouterState({ select: (s) => s.isLoading })
  const wrapRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef(0)

  useEffect(() => {
    const wrap = wrapRef.current
    const bar = barRef.current
    if (!wrap || !bar) return

    if (isLoading) {
      if (hideRef.current) clearTimeout(hideRef.current)
      progressRef.current = 0
      wrap.style.opacity = '1'
      wrap.style.display = 'block'
      bar.style.transition = 'none'
      bar.style.width = '0%'

      intervalRef.current = setInterval(() => {
        if (progressRef.current >= 85) return
        progressRef.current = Math.min(
          progressRef.current + Math.random() * 10 + 5,
          85,
        )
        bar.style.transition = 'width 0.15s ease-out'
        bar.style.width = `${progressRef.current}%`
      }, 150)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      bar.style.transition = 'width 0.2s ease-out'
      bar.style.width = '100%'
      wrap.style.transition = 'opacity 0.25s ease 0.15s'
      wrap.style.opacity = '0'
      hideRef.current = setTimeout(() => {
        wrap.style.display = 'none'
        wrap.style.transition = ''
        progressRef.current = 0
      }, 450)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (hideRef.current) clearTimeout(hideRef.current)
    }
  }, [isLoading])

  return (
    <div
      ref={wrapRef}
      style={{ display: 'none' }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]"
      aria-hidden="true"
    >
      <div
        ref={barRef}
        className="h-full rounded-r-full shadow-[0_0_8px_var(--lagoon)]"
        style={{
          width: '0%',
          background:
            'linear-gradient(90deg, var(--lagoon-deep), var(--lagoon))',
        }}
      />
    </div>
  )
}

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
      <RouteProgressBar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5 md:py-6">
        <aside className="app-sidebar hidden w-60 shrink-0 flex-col overflow-hidden md:flex">
          {/* Brand section */}
          <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-4 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--lagoon-deep)] text-sm font-bold text-white shadow-sm">
              GB
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--sea-ink)]">
                Gestão Bem
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

          <div className="mt-auto border-t border-[var(--line)] p-2">
            <SidebarLogoutButton />
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
