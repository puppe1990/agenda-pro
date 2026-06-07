import { z } from 'zod'

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().default('file:local.db'),
  TURSO_AUTH_TOKEN: z.string().optional(),
  BETTER_AUTH_SECRET: z
    .string()
    .default('better-auth-secret-that-is-long-enough-for-local-tests'),
  BETTER_AUTH_URL: z.string().default('http://localhost:3000'),
})

export function readEnv() {
  return envSchema.parse(process.env)
}

export function readDatabaseEnv() {
  const env = readEnv()
  return {
    tursoUrl: env.TURSO_DATABASE_URL,
    tursoAuthToken: env.TURSO_AUTH_TOKEN,
  }
}
