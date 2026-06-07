declare module '*.mdx' {
  import type { ComponentType } from 'react'

  import type { BlogPostMeta } from '#/lib/blog'

  export const meta: BlogPostMeta
  const MDXComponent: ComponentType
  export default MDXComponent
}
