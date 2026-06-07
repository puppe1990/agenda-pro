import { createFileRoute } from '@tanstack/react-router'

import { AuthForm } from '#/components/AuthForm'

export const Route = createFileRoute('/login')({
  component: () => (
    <main className="page-wrap px-4 py-14">
      <AuthForm mode="login" />
    </main>
  ),
})
