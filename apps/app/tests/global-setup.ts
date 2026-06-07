import { execSync } from 'node:child_process'
import { unlinkSync } from 'node:fs'

export default async function globalSetup() {
  const testDbUrl = process.env.TURSO_DATABASE_URL ?? 'file:tests-vitest.db'
  const testDbPath = testDbUrl.replace('file:', '')

  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    try {
      unlinkSync(`${testDbPath}${suffix}`)
    } catch {
      // fresh database
    }
  }

  execSync('./node_modules/.bin/drizzle-kit push', {
    stdio: 'inherit',
    env: {
      ...process.env,
      TURSO_DATABASE_URL: testDbUrl,
    },
  })
}
