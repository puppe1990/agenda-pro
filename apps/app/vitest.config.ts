import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    globalSetup: ['./tests/global-setup.ts'],
    setupFiles: ['./tests/setup.ts'],
    env: {
      TURSO_DATABASE_URL: 'file:tests-vitest.db',
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
})
