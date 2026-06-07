import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'

import { readEnv } from '#/lib/env'
import { db } from '#/server/db/client'
import * as schema from '#/server/db/schema'

const env = readEnv()

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
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
