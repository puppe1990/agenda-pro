import { execSync } from 'node:child_process'
import { unlinkSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const dbPath =
  process.env.TURSO_DATABASE_URL?.replace('file:', '').split('?')[0] ??
  path.join(rootDir, '..', 'e2e.db')

for (const suffix of ['', '-journal', '-wal', '-shm']) {
  try {
    unlinkSync(`${dbPath}${suffix}`)
  } catch {
    // fresh database
  }
}

execSync('./node_modules/.bin/drizzle-kit push', {
  stdio: 'inherit',
  env: process.env,
})

const { eq } = await import('drizzle-orm')
const { db, tursoClient } = await import('#/server/db/client')
const { users } = await import('#/server/db/schema')
const { seedDemoOrganization } = await import('#/server/db/seed')
const { auth } = await import('#/server/auth')

await seedDemoOrganization()

const e2eEmail = 'e2e-fixed@gmail.com'
const existing = await db.query.users.findFirst({
  where: eq(users.email, e2eEmail),
})

if (!existing) {
  await auth.api.signUpEmail({
    body: {
      email: e2eEmail,
      password: 'SenhaE2E-123',
      name: 'E2E Profissional',
    },
  })
}

await tursoClient.close()

console.log('E2E database ready:', dbPath)
