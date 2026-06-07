import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/server/db/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
  },
})
