import { createFileRoute, redirect } from '@tanstack/react-router'

import { AppShell } from '#/components/AppShell'
import { getSessionFn } from '#/server/fns/session'

export const Route = createFileRoute('/app')({
  beforeLoad: async ({ location }) => {
    const session = await getSessionFn()
    if (!session?.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: AppShell,
})
