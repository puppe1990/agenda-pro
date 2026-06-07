import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.TURSO_DATABASE_URL ?? 'file:local.db'
const isLocalDatabase = databaseUrl.startsWith('file:')

export default defineConfig({
  schema: './src/server/db/schema/index.ts',
  out: './drizzle',
  dialect: isLocalDatabase ? 'sqlite' : 'turso',
  dbCredentials: isLocalDatabase
    ? { url: databaseUrl }
    : {
        url: databaseUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      },
})
