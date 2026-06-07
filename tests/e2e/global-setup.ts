import { execSync } from 'node:child_process'
import { unlinkSync } from 'node:fs'

const e2eDbUrl = process.env.TURSO_DATABASE_URL ?? 'file:e2e.db'

export default async function globalSetup() {
  const testDbPath = e2eDbUrl.replace('file:', '')

  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    try {
      unlinkSync(`${testDbPath}${suffix}`)
    } catch {
      // fresh database
    }
  }

  const env = {
    ...process.env,
    TURSO_DATABASE_URL: e2eDbUrl,
  }

  execSync('pnpm db:push', { stdio: 'inherit', env })
  execSync('pnpm db:seed', { stdio: 'inherit', env })
}
