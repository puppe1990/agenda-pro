import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const e2ePort = Number(process.env.E2E_PORT ?? 3456)
const e2eBaseUrl = `http://localhost:${e2ePort}`
const e2eDatabaseUrl =
  process.env.TURSO_DATABASE_URL ?? `file:${path.join(rootDir, 'e2e.db')}`

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: e2eBaseUrl,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `./node_modules/.bin/tsx scripts/e2e-bootstrap.ts && ./node_modules/.bin/vite dev --port ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: false,
    env: {
      TURSO_DATABASE_URL: e2eDatabaseUrl,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ??
        'better-auth-secret-that-is-long-enough-for-local-tests',
      BETTER_AUTH_URL: e2eBaseUrl,
    },
  },
})
