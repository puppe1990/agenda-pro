import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  ssr: {
    noExternal: ['better-auth', '@better-auth/drizzle-adapter'],
  },
  build: {
    rollupOptions: {
      external: ['kysely', '@better-auth/kysely-adapter'],
    },
  },
  plugins: [
    devtools(),
    nitro({
      preset: 'aws_amplify',
      traceDeps: [
        '@better-auth/kysely-adapter*',
        '@better-auth/core*',
        '@better-auth/utils*',
        'kysely*',
      ],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
