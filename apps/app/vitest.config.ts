import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    fileParallelism: false,
    globalSetup: ['./tests/global-setup.ts'],
    setupFiles: ['./tests/setup.ts'],
    env: {
      TURSO_DATABASE_URL: 'file:tests-vitest.db',
      AWS_REGION: process.env.AWS_REGION ?? 'sa-east-1',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET ?? 'gestao-bem-uploads',
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
})
