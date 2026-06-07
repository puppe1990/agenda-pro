import { z } from 'zod'

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().default('file:local.db'),
  TURSO_AUTH_TOKEN: z.string().optional(),
  BETTER_AUTH_SECRET: z
    .string()
    .default('better-auth-secret-that-is-long-enough-for-local-tests'),
  BETTER_AUTH_URL: z.string().default('http://localhost:3000'),
})

const storageEnvSchema = z.object({
  S3_REGION: z.string().default('sa-east-1'),
  S3_ACCESS_KEY_ID: z.string().default(''),
  S3_SECRET_ACCESS_KEY: z.string().default(''),
  S3_BUCKET: z.string().default('gestao-bem-uploads'),
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

export function readStorageEnv() {
  return storageEnvSchema.parse(process.env)
}
