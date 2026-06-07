import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'

import { readEnv } from '#/lib/env'
import { db } from '#/server/db/client'
import * as schema from '#/server/db/schema'

const env = readEnv()

function buildTrustedOrigins() {
  const origins = new Set<string>([env.BETTER_AUTH_URL])

  for (const origin of process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ??
    []) {
    const trimmed = origin.trim()
    if (trimmed) origins.add(trimmed)
  }

  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:*')
    origins.add('http://127.0.0.1:*')
  }

  return [...origins]
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: buildTrustedOrigins(),
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    modelName: 'users',
  },
})

export type Auth = typeof auth
