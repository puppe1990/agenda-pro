import { eq } from 'drizzle-orm'

import { db } from '#/server/db/client'
import { users } from '#/server/db/schema'
import { auth } from '#/server/auth'

const E2E_EMAIL = 'e2e-fixed@gmail.com'
const E2E_PASSWORD = 'SenhaE2E-123'

const existing = await db.query.users.findFirst({
  where: eq(users.email, E2E_EMAIL),
})

if (!existing) {
  await auth.api.signUpEmail({
    body: {
      email: E2E_EMAIL,
      password: E2E_PASSWORD,
      name: 'E2E Profissional',
    },
  })
}

console.log(`E2E user ready: ${E2E_EMAIL}`)
