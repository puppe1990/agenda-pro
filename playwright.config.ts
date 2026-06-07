import { defineConfig, devices } from '@playwright/test'

const e2ePort = Number(process.env.E2E_PORT ?? 3456)
const e2eBaseUrl = `http://localhost:${e2ePort}`

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: e2eBaseUrl,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec vite dev --port ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: false,
    env: {
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ?? 'file:e2e.db',
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ??
        'better-auth-secret-that-is-long-enough-for-local-tests',
      BETTER_AUTH_URL: e2eBaseUrl,
    },
  },
})
