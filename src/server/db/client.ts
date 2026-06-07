import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import { readDatabaseEnv } from '#/lib/env'
import * as schema from '#/server/db/schema'

const env = readDatabaseEnv()

export const tursoClient = createClient({
  url: env.tursoUrl,
  authToken: env.tursoAuthToken,
})

export const db = drizzle(tursoClient, { schema })
