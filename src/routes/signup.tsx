import { createFileRoute } from '@tanstack/react-router'

import { AuthForm } from '#/components/AuthForm'

export const Route = createFileRoute('/signup')({
  component: () => (
    <main className="page-wrap px-4 py-14">
      <AuthForm mode="signup" />
    </main>
  ),
})
