import { defineConfig, devices } from '@playwright/test'

const landingPort = Number(process.env.LANDING_E2E_PORT ?? 3457)
const landingBaseUrl = `http://localhost:${landingPort}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: landingBaseUrl,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `./node_modules/.bin/vite dev --port ${landingPort} --strictPort`,
    url: landingBaseUrl,
    reuseExistingServer: false,
    timeout: process.env.CI ? 120_000 : 60_000,
    env: {
      VITE_APP_URL: 'http://localhost:3000',
    },
  },
})
