import type { ComponentType } from 'react'

import { getPostBySlug, sortPostsByDate, type BlogPostMeta } from '#/lib/blog'

type BlogPostModule = {
  meta: BlogPostMeta
  default: ComponentType
}

const postModules = import.meta.glob<BlogPostModule>(
  '../../content/blog/*.mdx',
  { eager: true },
)

function getModules(): BlogPostModule[] {
  return Object.values(postModules)
}

export function getAllBlogPosts(): BlogPostMeta[] {
  return sortPostsByDate(getModules().map((module) => module.meta))
}

export function getBlogPostModule(slug: string): BlogPostModule | undefined {
  const post = getPostBySlug(getAllBlogPosts(), slug)
  if (!post) {
    return undefined
  }

  return getModules().find((module) => module.meta.slug === post.slug)
}
