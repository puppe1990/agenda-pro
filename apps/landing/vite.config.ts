import mdx from '@mdx-js/rollup'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    nitro({ preset: 'aws_amplify' }),
    tailwindcss(),
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [
          remarkFrontmatter,
          [remarkMdxFrontmatter, { name: 'meta' }],
        ],
      }),
    },
    tanstackStart(),
    viteReact(),
  ],
})
